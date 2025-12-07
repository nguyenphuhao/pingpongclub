/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          lightest: '#E7E4F9',
          main: '#7C5CDB',
          dark: '#5E44B8',
          darkest: '#463184',
        },
        secondary: {
          lightest: '#FFE8D4',
          main: '#FF8F2E',
          dark: '#ED6F0D',
          darkest: '#5B3013',
        },
        accent: {
          blue: '#0D99FF',
          green: '#019E5B',
          yellow: '#FFD33F',
          red: '#FF5E65',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

