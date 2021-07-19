const postcss = require('rollup-plugin-postcss');
const images = require('@rollup/plugin-image');

module.exports = {
  rollup(config, options) {
    config.plugins = [
      images({ include: ['**/*.png'] }),
      postcss({
        plugins: [],
      }),
      ...config.plugins,
    ];
    return config;
  },
};