import type { CustomTypeReadHook } from "@slicemachine/plugin-kit";
import * as prismicT from "@prismicio/types";

import { readJSONFile } from "../lib/readJSONFile";

import type { PluginOptions } from "../types";

export const customTypeRead: CustomTypeReadHook<PluginOptions> = async (
	data,
	{ helpers },
) => {
	const filePath = helpers.joinPathFromRoot(
		"customtypes",
		data.id,
		"index.json",
	);

	return await readJSONFile<prismicT.CustomTypeModel>(filePath);
};
