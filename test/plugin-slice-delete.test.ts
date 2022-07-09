import { test, expect } from "vitest";
import { createMockFactory } from "@prismicio/mock";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as tsm from "ts-morph";

import { parseSourceFile } from "./lib/parseSourceFile";

/**
 * !!! DO NOT use this mock factory in tests !!!
 *
 * @remarks
 * Its seed is not specific to be used outside the most general cases.
 */
const mock = createMockFactory({ seed: import.meta.url });

// Slice model to be used in general tests.
const model = mock.model.sharedSlice({
	id: "bar_baz",
	variations: [mock.model.sharedSliceVariation()],
});

test("deletes the Slice directory", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", { libraryID: "foo", model });

	expect(await fs.readdir(path.join(ctx.project.root, "foo"))).includes(
		"BarBaz",
	);

	await ctx.pluginRunner.callHook("slice:delete", { libraryID: "foo", model });

	expect(await fs.readdir(path.join(ctx.project.root, "foo"))).not.includes(
		"BarBaz",
	);
});

test("removes the Slice from the library index", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", { libraryID: "foo", model });

	const beforeFile = parseSourceFile(
		await fs.readFile(path.join(ctx.project.root, "foo", "index.js"), "utf8"),
	);

	expect(
		beforeFile
			.getVariableDeclarationOrThrow("components")
			.getInitializerIfKindOrThrow(tsm.SyntaxKind.ObjectLiteralExpression)
			.getProperty("bar_baz"),
	).toBeTruthy();

	await ctx.pluginRunner.callHook("slice:delete", { libraryID: "foo", model });

	const afterFile = parseSourceFile(
		await fs.readFile(path.join(ctx.project.root, "foo", "index.js"), "utf8"),
	);

	expect(
		afterFile
			.getVariableDeclarationOrThrow("components")
			.getInitializerIfKindOrThrow(tsm.SyntaxKind.ObjectLiteralExpression)
			.getProperty("bar_baz"),
	).toBeUndefined();
});
