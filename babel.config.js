// Required by https://www.amcharts.com/docs/v5/getting-started/integrations/jest/
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
