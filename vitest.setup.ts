import { beforeEach } from "vitest";
import {
	createSliceMachinePluginRunner,
	SliceMachinePlugin,
	SliceMachinePluginRunner,
	SliceMachineProject,
} from "@slicemachine/plugin-kit";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import adapter, { PluginOptions } from "./src";

declare module "vitest" {
	export interface TestContext {
		project: SliceMachineProject & {
			config: {
				adapter: {
					resolve: SliceMachinePlugin;
					options: PluginOptions;
				};
			};
		};
		pluginRunner: SliceMachinePluginRunner;
	}
}

beforeEach(async (ctx) => {
	const tmpRoot = await fs.mkdtemp(
		path.join(os.tmpdir(), "@slicemachine__adapter-next___"),
	);

	ctx.project = {
		root: tmpRoot,
		config: {
			_latest: "0.0.0",
			adapter: {
				resolve: adapter,
				options: {},
			},
			apiEndpoint: "https://qwerty.cdn.prismic.io/api/v2",
		},
	};

	ctx.pluginRunner = createSliceMachinePluginRunner({ project: ctx.project });

	await ctx.pluginRunner.init();

	return async () => {
		await fs.rm(ctx.project.root, { recursive: true });
	};
});
