import type { SliceReadHook } from "@slicemachine/plugin-kit";
import * as prismicT from "@prismicio/types";

import { readJSONFile } from "../lib/readJSONFile";
import { pascalCase } from "../lib/pascalCase";

import type { PluginOptions } from "../types";

export const sliceRead: SliceReadHook<PluginOptions> = async (
	data,
	{ helpers },
) => {
	const filePath = helpers.joinPathFromRoot(
		data.libraryID,
		pascalCase(data.sliceID),
		"model.json",
	);

	return await readJSONFile<prismicT.SharedSliceModel>(filePath);
};
