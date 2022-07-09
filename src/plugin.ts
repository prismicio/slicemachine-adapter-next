import { defineSliceMachinePlugin } from "@slicemachine/plugin-kit";

import { name as pkgName } from "../package.json";
import { PluginOptions } from "./types";

import { sliceCreate } from "./hooks/slice-create";
import { sliceUpdate } from "./hooks/slice-update";
import { sliceDelete } from "./hooks/slice-delete";
import { sliceRead } from "./hooks/slice-read";
import { sliceLibraryRead } from "./hooks/slice-library-read";
import { customTypeCreate } from "./hooks/customType-create";
import { customTypeUpdate } from "./hooks/customType-update";
import { customTypeDelete } from "./hooks/customType-delete";
import { customTypeRead } from "./hooks/customType-read";
import { customTypeLibraryRead } from "./hooks/customType-library-read";
import { snippetRead } from "./hooks/snippet-read";
import { sliceSimulatorSetupRead } from "./hooks/sliceSimulator-setup-read";

export const plugin = defineSliceMachinePlugin<PluginOptions>({
	meta: {
		name: pkgName,
	},
	defaultOptions: {
		format: true,
	},
	setup({ hook }) {
		hook("slice:create", sliceCreate);
		hook("slice:update", sliceUpdate);
		hook("slice:delete", sliceDelete);
		hook("slice:read", sliceRead);
		hook("slice-library:read", sliceLibraryRead);

		hook("custom-type:create", customTypeCreate);
		hook("custom-type:update", customTypeUpdate);
		hook("custom-type:delete", customTypeDelete);
		hook("custom-type:read", customTypeRead);
		hook("custom-type-library:read", customTypeLibraryRead);

		hook("snippet:read", snippetRead);

		hook("slice-simulator:setup:read", sliceSimulatorSetupRead);
	},
});
