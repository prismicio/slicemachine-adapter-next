import type { PluginOptions } from "../types";

export const getJSOrTSXFileExtension = (
	pluginOptions: PluginOptions,
): string => {
	if (pluginOptions.typescript) {
		return "tsx";
	} else if (pluginOptions.jsxExtension) {
		return "jsx";
	} else {
		return "js";
	}
};
