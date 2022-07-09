import type { SliceLibraryReadHook } from "@slicemachine/plugin-kit";
import * as prismicT from "@prismicio/types";
import * as fs from "node:fs/promises";
import * as path from "path";

import { readJSONFile } from "../lib/readJSONFile";

import type { PluginOptions } from "../types";

const isSharedSliceModel = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	input: any,
): input is prismicT.SharedSliceModel => {
	return (
		typeof input === "object" &&
		input !== null &&
		"type" in input &&
		input.type === prismicT.CustomTypeModelSliceType.SharedSlice
	);
};

export const sliceLibraryRead: SliceLibraryReadHook<PluginOptions> = async (
	data,
	{ helpers },
) => {
	const dirPath = helpers.joinPathFromRoot(data.libraryID);

	const childDirs = await fs.readdir(dirPath);

	const sliceIDs: string[] = [];
	await Promise.all(
		childDirs.map(async (childDir) => {
			const modelPath = path.join(dirPath, childDir, "model.json");

			try {
				const modelContents = await readJSONFile(modelPath);

				if (isSharedSliceModel(modelContents)) {
					sliceIDs.push(modelContents.id);
				}
			} catch {
				// noop
			}
		}),
	);

	return {
		id: data.libraryID,
		sliceIDs: sliceIDs.sort(),
	};
};
