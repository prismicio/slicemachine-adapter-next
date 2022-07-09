import { SliceMachineContext } from "@slicemachine/plugin-kit";
import { stripIndent } from "common-tags";

import { PluginOptions } from "../types";

import { pascalCase } from "./pascalCase";

type BuildSliceLibraryIndexFileContentsArgs = {
	libraryID: string;
} & SliceMachineContext<PluginOptions>;

export const buildSliceLibraryIndexFileContents = async (
	args: BuildSliceLibraryIndexFileContentsArgs,
): Promise<{ filePath: string; contents: string }> => {
	const filePath = args.helpers.joinPathFromRoot(
		args.libraryID,
		args.options.typescript ? "index.ts" : "index.js",
	);
	const sliceLibrary = await args.actions.readSliceLibrary({
		libraryID: args.libraryID,
	});

	let contents = stripIndent`
		import dynamic from 'next/dynamic'

		export const components = {
			${sliceLibrary.sliceIDs.map(
				(id) => `${id}: dynamic(() => import('./${pascalCase(id)}')),`,
			)}
		}
	`;

	if (args.options.format) {
		contents = await args.helpers.format(contents, filePath);
	}

	return { filePath, contents };
};
