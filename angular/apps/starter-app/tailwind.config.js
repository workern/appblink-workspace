/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../libs/shared/ng-components/tailwind.config.js')],
  content: [
    './src/**/*.{html,ts}',
    '../../libs/shared/ng-components/src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      // Starter app-specific overrides
    }
  },
  plugins: []
};
