export type PluginOptions = {
	format?: boolean;
} & (
	| {
			typescript?: false;
			jsxExtension?: boolean;
	  }
	| {
			typescript: true;
			jsxExtension?: never;
	  }
);
