import type { CustomTypeDeleteHook } from "@slicemachine/plugin-kit";
import * as fs from "node:fs/promises";

import type { PluginOptions } from "../types";

export const customTypeDelete: CustomTypeDeleteHook<PluginOptions> = async (
	data,
	{ helpers },
) => {
	const dir = helpers.joinPathFromRoot("customtypes", data.model.id);

	await fs.rm(dir, { recursive: true });
};
