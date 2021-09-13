import ejs from "ejs";
import { minify } from "html-minifier";
import { readFileSync } from "fs";

export default function createHTMLPlugin({ debug, title }) {
	const templatePath = "./lib/index.ejs";
	const bundleFile = "bundle.js";

	return {
		name: "create-html-plugin",
		buildStart() {
			this.addWatchFile(templatePath);
		},
		async generateBundle(options, bundle) {
			const template = readFileSync(templatePath, { encoding: "utf8" });
			const script = debug ? `<script src="${bundleFile}"></script>` : `<script>${bundle[bundleFile].code}</script>`;
			const html = await ejs.render(template, {
				title,
				script
			});
			const source = debug
				? html
				: minify(html, {
					removeAttributeQuotes: true,
					collapseWhitespace: true,
					collapseBooleanAttributes: true
				});

			this.emitFile({
				type: "asset",
				fileName: "index.html",
				source
			});
			if (!debug) delete bundle[bundleFile];
		}
	};
}
