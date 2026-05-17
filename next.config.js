const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      axios: path.resolve(process.cwd(), "lib/axios.js"),
    };

    return config;
  },
};

module.exports = nextConfig;
