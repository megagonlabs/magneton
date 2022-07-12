import { Configuration } from "webpack";
import "webpack-dev-server";
import * as path from "path";

/**
 * Utility function for creating custom Webpack configurations
 */
const extend = <T>(base: T, ext: any): T => {
  if (base && ext && typeof base === "object" && typeof ext === "object") {
    const result = { ...base } as any;
    Object.keys(ext).forEach((key) => {
      result[key] = extend(result[key], ext[key]);
    });
    return result;
  } else {
    return ext;
  }
};

/**
 * Base configuration used in all environments
 */
const base: Configuration = {
  // Get Webpack to recognize and load TypeScript files
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              // Ignore type errors ... for now
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },

  output: {
    // Output as a module so IDOM can use it
    module: true,
    library: { type: "module" },

    // Place the bundle directly in kyurem_client folder
    path: path.resolve(__dirname, "../kyurem_client"),
  },

  // Enable experimental output mode to allow
  // for exporting as a module
  experiments: {
    outputModule: true,
  },

  // Declare underscore as an external library and skip it
  // when bundling
  externals: {
    underscore: "root _",
  },

  // Since we're not serving the bundle over the internet
  // we can ignore performance issues due to bundle size
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};

/**
 * Configuration for use in development environment
 */
const dev: Configuration = extend(base, {
  mode: "development",

  output: {
    filename: "bundle.js",
  },

  // Watch files for changes
  watch: true,
});

/**
 * Configuration for use in production environment
 */
const prod: Configuration = {
  ...base,
  mode: "production",

  output: {
    filename: "bundle.min.js",
  },
};

const config = process.env.NODE_ENV === "development" ? dev : prod;
export default config;
