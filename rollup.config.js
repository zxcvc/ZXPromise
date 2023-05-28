import { resolve } from "path";
import { defineConfig } from "rollup";

import ts from "rollup-plugin-typescript2";

export default defineConfig([
	{
		input: resolve(__dirname, "./src/ZXPromise.ts"),
		output: [
			{
				format: "esm",
				file: "dist/index.esm.js",
			},
			{
				format: "cjs",
				file: "dist/index.cjs.js",
			},
			{
				format: "amd",
				file: "dist/index.amd.js",
			},
			{
				format: "umd",
				file: "dist/index.umd.js",
				name: "Promise",
			},
			{
				format: "umd",
				file: "dist/index.js",
				name: "Promise",
			},
		],
		plugins: [ts()],
	},
]);
