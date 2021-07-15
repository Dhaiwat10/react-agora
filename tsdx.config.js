const postcss = require('rollup-plugin-postcss');
const images = require('@rollup/plugin-image');

module.exports = {
  rollup(config, options) {
    config.plugins.push(
      postcss({
        plugins: [],
      }),
      images({ include: ['**/*.png'] })
    );
    return config;
  },
};
