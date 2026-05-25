// app.config.js — replaces app.json so we can inject env vars at build time
// Set API_URL in your .env file (or EAS secrets) to point to production backend

const { withInfoPlist } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL ?? null,
    },
  };
};
