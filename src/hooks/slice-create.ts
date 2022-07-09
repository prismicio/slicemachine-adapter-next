import type {
	SliceCreateHook,
	SliceCreateHookData,
	SliceMachineContext,
} from "@slicemachine/plugin-kit";
import { generateTypes } from "prismic-ts-codegen";
import { stripIndent } from "common-tags";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { buildSliceLibraryIndexFileContents } from "../lib/buildSliceLibraryIndexFileContents";
import { getJSOrTSXFileExtension } from "../lib/getJSOrTSXFileExtension";
import { pascalCase } from "../lib/pascalCase";

import type { PluginOptions } from "../types";

type Args = {
	dir: string;
	data: SliceCreateHookData;
} & SliceMachineContext<PluginOptions>;

const createModelFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "model.json");

	let contents = JSON.stringify(data.model);

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

const createComponentFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, `index.${getJSOrTSXFileExtension(options)}`);
	const model = data.model;
	const pascalID = pascalCase(model.id);

	let contents: string;

	if (options.typescript) {
		contents = stripIndent`
			import { SliceComponentProps } from "@prismicio/react";
			import { ${pascalID}Slice } from "./types";

			/**
			 * Props for \`${pascalID}\`.
			 */
			export type ${pascalID}Props = SliceComponentProps<${pascalID}Slice>;

			/**
			 * Component for "${model.name}" Slices.
			 */
			const ${pascalID} = ({ slice }: ${pascalID}Props): React.Element => {
				return (
					<section
						data-slice-type={slice.slice_type}
						data-slice-variation={slice.variation}
					>
						Placeholder component for ${model.id} (variation: {slice.variation}) Slices
					</section>
				);
			};

			export default ${pascalID}
		`;
	} else {
		contents = stripIndent`
			/**
			 * @typedef {import("./types").${pascalID}Slice} ${pascalID}Slice
			 * @typedef {import("@prismicio/react").SliceComponentProps<${pascalID}Slice>} ${pascalID}Props
			 * @param {${pascalID}Props}
			 */
			const ${pascalID} = ({ slice }) => {
				return (
					<section
						data-slice-type={slice.slice_type}
						data-slice-variation={slice.variation}
					>
						Placeholder component for ${model.id} (variation: {slice.variation}) Slices
					</section>
				);
			};

			export default ${pascalID};
		`;
	}

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

const createTypesFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "types.ts");

	let contents = generateTypes({
		sharedSliceModels: [data.model],
	});

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

const upsertSliceLibraryIndexFile = async ({
	data,
	actions,
	helpers,
	project,
	options,
}: Omit<Args, "dir">) => {
	const { filePath, contents } = await buildSliceLibraryIndexFileContents({
		libraryID: data.libraryID,
		actions,
		helpers,
		project,
		options,
	});

	await fs.writeFile(filePath, contents);
};

export const sliceCreate: SliceCreateHook<PluginOptions> = async (
	data,
	context,
) => {
	const dir = context.helpers.joinPathFromRoot(
		data.libraryID,
		pascalCase(data.model.id),
	);

	await fs.mkdir(dir, { recursive: true });

	await Promise.allSettled([
		createModelFile({ dir, data, ...context }),
		createComponentFile({ dir, data, ...context }),
		createTypesFile({ dir, data, ...context }),
	]);

	await upsertSliceLibraryIndexFile({ data, ...context });
};
