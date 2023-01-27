import { Configuration } from "webpack";
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
  entry: "./src/magneton",

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
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },

  output: {
    // Output as a module so IDOM can use it
    module: true,
    library: { type: "module" },

    path: path.resolve(__dirname, "src/magneton"),
  },

  // Enable experimental output mode to allow
  // for exporting as a module
  experiments: {
    outputModule: true,
  },

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

  devtool: "eval-source-map",

  output: {
    filename: "bundle.dev.js",
  },

  // Optimize bundle size by getting React from a CDN
  externals: {
    react: "https://esm.sh/react@18?dev",
    "react-dom": "https://esm.sh/react-dom@18?dev",
  },

  // Watch files for changes
  watch: true,
});

/**
 * Configuration for use in production environment
 */
const prod: Configuration = extend(base, {
  mode: "production",

  output: {
    filename: "bundle.min.js",
  },

  // Optimize bundle size by getting React from a CDN
  externals: {
    react: "https://esm.sh/react@18",
    "react-dom": "https://esm.sh/react-dom@18",
  },
});

const config = process.env.NODE_ENV === "development" ? dev : prod;
export default config;
