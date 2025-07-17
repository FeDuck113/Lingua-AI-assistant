await Bun.build({
	entrypoints: ["src/app.ts"],
	target: "bun",
	outdir: "out",
	plugins: [],
}).then(console.log);

export {};
