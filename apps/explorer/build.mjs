import { build } from "esbuild";

await build({
  entryPoints: ["public/app.js"],
  bundle: true,
  format: "esm",
  outfile: "public/bundle.js",
});
