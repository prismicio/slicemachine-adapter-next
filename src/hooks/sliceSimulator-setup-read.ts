import type {
	SliceMachineContext,
	SliceSimulatorSetupReadHook,
	SliceSimulatorSetupStep,
} from "@slicemachine/plugin-kit";
import { SliceSimulatorSetupStepValidationMessageType } from "@slicemachine/plugin-kit";
import { stripIndent } from "common-tags";
import { createRequire } from "node:module";
import * as http from "node:http";

import { getJSOrTSXFileExtension } from "../lib/getJSOrTSXFileExtension";

import type { PluginOptions } from "../types";

const REQUIRED_DEPENDENCIES = [
	"@prismicio/react",
	"@prismicio/slice-simulator-react",
	"@prismicio/client@latest",
	"@prismicio/helpers",
];

type Args = SliceMachineContext<PluginOptions>;

const createStep1 = async ({
	project,
}: Args): Promise<SliceSimulatorSetupStep> => {
	const require = createRequire(project.root);

	return {
		title: "Install packages",
		body: stripIndent`
			The simulator requires extra dependencies. Run the following command to install them.

			~~~sh
			npm install --save @prismicio/react @prismicio/slice-simulator-react @prismicio/client@latest @prismicio/helpers
			~~~
		`,
		validate: async () => {
			const missingDependencies: string[] = [];

			for (const dependency of REQUIRED_DEPENDENCIES) {
				try {
					// `require.resolve()` is preferred
					// over `import()` because we don't
					// want to load the module. Loading a
					// module could introduce side-effects.
					require.resolve(dependency);
				} catch {
					missingDependencies.push(dependency);
				}
			}

			if (missingDependencies.length >= REQUIRED_DEPENDENCIES.length) {
				return {
					type: SliceSimulatorSetupStepValidationMessageType.Error,
					title: "Missing all dependencies",
					message: stripIndent`
						Install the required dependencies to continue.
					`,
				};
			}

			if (missingDependencies.length > 0) {
				const formattedMissingDependencies = missingDependencies
					.map((missingDependency) => `\`${missingDependency}\``)
					.join(", ");

				return {
					type: SliceSimulatorSetupStepValidationMessageType.Warning,
					title: "Missing some dependencies",
					message: stripIndent`
						The following dependencies are missing: ${formattedMissingDependencies}
					`,
				};
			}
		},
	};
};

const createStep2 = async ({
	helpers,
	options,
}: Args): Promise<SliceSimulatorSetupStep> => {
	const fileName = `slice-simulator.${getJSOrTSXFileExtension}`;
	const filePath = helpers.joinPathFromRoot("pages", fileName);

	let fileContents: string;

	if (options.typescript) {
		fileContents = stripIndent`
			import { GetStaticProps } from "next/types";
			import { SliceSimulator } from "@prismicio/slice-simulator-react";
			import { SliceZone } from "@prismicio/react";

			import state from "../.slicemachine/libraries-state.json";
			import { components } from "../slices";

			const SliceSimulatorPage = () => {
				return (
					<SliceSimulator
						sliceZone={(props) => <SliceZone {...props} components={components} />}
						state={state}
					/>
				);
			};

			export default SliceSimulatorPage;

			export const getStaticProps: GetStaticProps = () => {
				return {
					// Exclude this page from production builds.
					notFound: process.env.NODE_ENV === "production",
				};
			};
		`;
	} else {
		fileContents = stripIndent`
			import { SliceSimulator } from "@prismicio/slice-simulator-react";
			import { SliceZone } from "@prismicio/react";

			import state from "../.slicemachine/libraries-state.json";
			import { components } from "../slices";

			const SliceSimulatorPage = () => {
				return (
					<SliceSimulator
						sliceZone={(props) => <SliceZone {...props} components={components} />}
						state={state}
					/>
				);
			};

			export default SliceSimulatorPage;

			export const getStaticProps= () => {
				return {
					// Exclude this page from production builds.
					notFound: process.env.NODE_ENV === "production",
				};
			};
		`;
	}

	fileContents = await helpers.format(fileContents, filePath);

	return {
		title: "Create a page for the simulator",
		body: stripIndent`
			In your \`pages\` directory, create a file called \`${fileName}\` and add the following code. This route will be used to simulate and develop your components.

			~~~tsx
			${fileContents}
			~~~
		`,
	};
};

const createStep3 = async ({
	helpers,
}: Args): Promise<SliceSimulatorSetupStep> => {
	const filePath = helpers.joinPathFromRoot("sm.json");
	const fileContents = await helpers.format(
		`
			{
				"localSliceSimulatorURL": "http://localhost:3000/slice-simulator"
			}
		`,
		filePath,
	);

	return {
		title: "Update `sm.json`",
		body: stripIndent`
			Update your \`sm.json\` file with a \`localSliceSimulatorURL\` property pointing to your \`slice-simulator\` page.

			~~~json
			${fileContents}
			~~~
		`,
		validate: async () => {
			const project = await helpers.getProject();

			if (!("localSliceSimulatorURL" in project.config)) {
				return {
					type: SliceSimulatorSetupStepValidationMessageType.Error,
					title: "Missing `localSliceSimulatorURL` property",
					message: stripIndent`
						A \`localSliceSimulatorURL\` property was not found in your \`sm.json\` file.
					`,
				};
			}

			// Test if the URL is valid.
			try {
				if (project.config.localSliceSimulatorURL) {
					new URL(project.config.localSliceSimulatorURL);
				} else {
					throw new Error("Undefined Slice Simulator URL");
				}
			} catch {
				return {
					type: SliceSimulatorSetupStepValidationMessageType.Warning,
					title: "An invalid URL was provided",
					message: stripIndent`
						The \`localSliceSimulatorURL\` property should be of the shape \`http://localhost:PORT/PATH\`. See the codeblock for an example.
					`,
				};
			}

			// Check if the URL is accessible.
			const ok = await new Promise<boolean>((resolve) => {
				if (project.config.localSliceSimulatorURL) {
					http.get(project.config.localSliceSimulatorURL, (res) => {
						if (res.statusCode) {
							resolve(res.statusCode >= 200 && res.statusCode < 300);
						}
					});
				}

				resolve(false);
			});

			if (!ok) {
				return {
					type: SliceSimulatorSetupStepValidationMessageType.Warning,
					title: "Unable to connect to simulator page",
					message: stripIndent`
						Check that the \`localSliceSimulatorURL\` property in \`sm.json\` is correct and try again. See the [troubleshooting page](https://prismic.io/docs/technologies/setup-slice-simulator-nextjs) for more details.
					`,
				};
			}
		},
	};
};

export const sliceSimulatorSetupRead: SliceSimulatorSetupReadHook<
	PluginOptions
> = async (_data, context) => {
	return Promise.all([
		createStep1(context),
		createStep2(context),
		createStep3(context),
	]);
};
