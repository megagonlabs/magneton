import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import ignore from "rollup-plugin-ignore";

const onwarn = (warning) => {
  if (warning.code !== "CIRCULAR_DEPENDENCY") {
    console.error(`(!) ${warning.message}`);
  }
};
const minify = process.argv[process.argv.length - 1] === "minify";
export default {
  input: "src/index.ts",
  output: {
    file: `../kyurem_client/bundle${minify ? ".min" : ""}.js`,
    format: "esm",
  },
  onwarn,
  plugins: [
    ignore(["underscore"]),
    nodeResolve({ jsnext: true, browser: true }),
    json(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    commonjs(),
    injectProcessEnv({
      NODE_ENV: JSON.stringify("production"),
    }),
    minify ? terser() : null,
    typescript(),
  ],
};
