import { test, expect } from "vitest";
import { createMockFactory } from "@prismicio/mock";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { generateTypes } from "prismic-ts-codegen";
import prettier from "prettier";

/**
 * !!! DO NOT use this mock factory in tests !!!
 *
 * @remarks
 * Its seed is not specific to be used outside the most general cases.
 */
const mock = createMockFactory({ seed: import.meta.url });

// Slice model to be used in general tests.
const oldModel = mock.model.sharedSlice({
	id: "bar_baz",
	variations: [mock.model.sharedSliceVariation()],
});

// Slice model to be used in general tests.
const newModel = mock.model.sharedSlice({
	id: "bar_baz",
	variations: [mock.model.sharedSliceVariation()],
});

test("updates model.json file with new model", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", {
		libraryID: "foo",
		model: oldModel,
	});

	await ctx.pluginRunner.callHook("slice:update", {
		libraryID: "foo",
		model: newModel,
	});

	expect(
		JSON.parse(
			await fs.readFile(
				path.join(ctx.project.root, "foo", "BarBaz", "model.json"),
				"utf8",
			),
		),
	).toStrictEqual(newModel);
});

test("updates types.ts file with new model", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", {
		libraryID: "foo",
		model: oldModel,
	});

	await ctx.pluginRunner.callHook("slice:update", {
		libraryID: "foo",
		model: newModel,
	});

	const contents = await fs.readFile(
		path.join(ctx.project.root, "foo", "BarBaz", "types.ts"),
		"utf8",
	);

	expect(contents).toBe(
		prettier.format(generateTypes({ sharedSliceModels: [newModel] }), {
			parser: "typescript",
		}),
	);
});
