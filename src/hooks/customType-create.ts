import type {
	CustomTypeCreateHook,
	CustomTypeCreateHookData,
	SliceMachineContext,
} from "@slicemachine/plugin-kit";
import { generateTypes } from "prismic-ts-codegen";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { PluginOptions } from "../types";

type Args = {
	dir: string;
	data: CustomTypeCreateHookData;
} & SliceMachineContext<PluginOptions>;

const createModelFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "index.json");

	let contents = JSON.stringify(data.model);

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

const createTypesFile = async ({ dir, data, helpers, options }: Args) => {
	const filePath = path.join(dir, "types.ts");

	// TODO: Figure out how to import Shared Slice types
	let contents = generateTypes({
		customTypeModels: [data.model],
	});

	if (options.format) {
		contents = await helpers.format(contents, filePath);
	}

	await fs.writeFile(filePath, contents);
};

export const customTypeCreate: CustomTypeCreateHook<PluginOptions> = async (
	data,
	context,
) => {
	const dir = context.helpers.joinPathFromRoot("customtypes", data.model.id);

	await fs.mkdir(dir, { recursive: true });

	await Promise.allSettled([
		createModelFile({ dir, data, ...context }),
		createTypesFile({ dir, data, ...context }),
	]);
};
