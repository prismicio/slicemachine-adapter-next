import type { SnippetReadHook } from "@slicemachine/plugin-kit";
import * as prismicT from "@prismicio/types";
import { stripIndent } from "common-tags";
import type { Config as PrettierConfig } from "prettier";

import type { PluginOptions } from "../types";

const prettierOptions: PrettierConfig = { parser: "typescript" };

const dotPath = (segments: string[]): string => {
	return segments.join(".");
};

export const snippetRead: SnippetReadHook<PluginOptions> = async (
	data,
	{ helpers },
) => {
	const { fieldPath } = data;

	const label = "React";

	switch (data.model.type) {
		case prismicT.CustomTypeModelFieldType.Link: {
			return {
				label,
				language: "tsx",
				code: await helpers.format(
					stripIndent`
						<PrismicLink field={${dotPath(fieldPath)}}>Link</PrismicLink>
					`,
					undefined,
					{ prettier: prettierOptions },
				),
			};
		}

		case prismicT.CustomTypeModelFieldType.Image: {
			return [
				{
					label: `${label} (next/image)`,
					language: "tsx",
					code: await helpers.format(
						stripIndent`
							<PrismicNextImage field={${dotPath(fieldPath)}} />
						`,
						undefined,
						{ prettier: prettierOptions },
					),
				},
				{
					label,
					language: "tsx",
					code: await helpers.format(
						stripIndent`
							<PrismicImage field={${dotPath(fieldPath)}} />
						`,
						undefined,
						{ prettier: prettierOptions },
					),
				},
			];
		}

		case prismicT.CustomTypeModelFieldType.Group: {
			const code = await helpers.format(
				stripIndent`
					<>{${dotPath(fieldPath)}.map(item => (
					  <>{/* Render content for item */}</>
					))}</>
				`,
				undefined,
				{ prettier: prettierOptions },
			);

			return {
				label,
				language: "tsx",
				code,
			};
		}

		case prismicT.CustomTypeModelFieldType.Slices: {
			const code = await helpers.format(
				stripIndent`
					<SliceZone
					  slices={${dotPath(fieldPath)}}
					  components={components}
					/>
				`,
				undefined,
				{ prettier: prettierOptions },
			);

			return {
				label,
				language: "tsx",
				code,
			};
		}

		default: {
			return {
				label,
				language: "tsx",
				code: await helpers.format(
					stripIndent`
						<>{${dotPath(fieldPath)}}</>
					`,
					undefined,
					{ prettier: prettierOptions },
				),
			};
		}
	}
};
