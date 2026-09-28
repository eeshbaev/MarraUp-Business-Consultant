const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** Expo app lives in `native/`; repo root is a Next.js app — keep Metro out of parent node_modules. */
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules/expo/node_modules"),
];

module.exports = config;
