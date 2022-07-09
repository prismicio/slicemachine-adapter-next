import type {
	SliceMachineContext,
	SliceUpdateHook,
	SliceUpdateHookData,
} from "@slicemachine/plugin-kit";
import { generateTypes } from "prismic-ts-codegen";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { pascalCase } from "../lib/pascalCase";

import type { PluginOptions } from "../types";

type Args = {
	dir: string;
	data: SliceUpdateHookData;
} & SliceMachineContext<PluginOptions>;

const updateModelFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "model.json");

	let contents = JSON.stringify(data.model);

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

const updateTypesFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "types.ts");

	let contents = generateTypes({
		sharedSliceModels: [data.model],
	});

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

export const sliceUpdate: SliceUpdateHook<PluginOptions> = async (
	data,
	context,
) => {
	const dir = context.helpers.joinPathFromRoot(
		data.libraryID,
		pascalCase(data.model.id),
	);

	await Promise.allSettled([
		updateModelFile({ dir, data, ...context }),
		updateTypesFile({ dir, data, ...context }),
	]);
};
