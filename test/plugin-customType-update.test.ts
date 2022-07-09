import { test, expect } from "vitest";
import { createMockFactory } from "@prismicio/mock";
import { generateTypes } from "prismic-ts-codegen";
import prettier from "prettier";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * !!! DO NOT use this mock factory in tests !!!
 *
 * @remarks
 * Its seed is not specific to be used outside the most general cases.
 */
const mock = createMockFactory({ seed: import.meta.url });

// Slice model to be used in general tests.
const oldModel = mock.model.customType({
	id: "foo",
	fields: { bar: mock.model.boolean() },
});

// Slice model to be used in general tests.
const newModel = mock.model.customType({
	id: "foo",
	fields: { baz: mock.model.boolean() },
});

test("updates model file with new model", async (ctx) => {
	await ctx.pluginRunner.callHook("custom-type:create", { model: oldModel });

	await ctx.pluginRunner.callHook("custom-type:update", { model: newModel });

	expect(
		JSON.parse(
			await fs.readFile(
				path.join(ctx.project.root, "customtypes", newModel.id, "index.json"),
				"utf8",
			),
		),
	).toStrictEqual(newModel);
});

test("updates types.ts file with new model", async (ctx) => {
	await ctx.pluginRunner.callHook("custom-type:create", { model: oldModel });

	await ctx.pluginRunner.callHook("custom-type:update", { model: newModel });

	const contents = await fs.readFile(
		path.join(ctx.project.root, "customtypes", newModel.id, "types.ts"),
		"utf8",
	);

	expect(contents).toBe(
		prettier.format(generateTypes({ customTypeModels: [newModel] }), {
			parser: "typescript",
		}),
	);
});
