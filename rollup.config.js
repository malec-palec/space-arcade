import createHTMLPlugin from "./lib/create-html";
import { terser } from "rollup-plugin-terser";

export default [
	{
		input: "src/main.js",
		output: {
			file: "dist/debug/bundle.js",
			format: "es",
			sourcemap: "inline"
		},
		plugins: [
			createHTMLPlugin({
				debug: true,
				title: "SPACE ARCADE - DEBUG"
			})
		]
	},
	{
		input: "src/main.js",
		output: {
			file: "dist/release/bundle.js",
			format: "es"
		},
		plugins: [
			terser(),
			createHTMLPlugin({ debug: false, title: "SPACE ARCADE" })
		]
	}
];
