/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xxs: '340px',

      xs: '640px',

      sm: '768px',

      md: '1024px',

      lg: '1280px',

      xl: '1440px',

      '2xl': '1600px',

      '3xl': '1800px',

      '4xl': '2000px',

      '5xl': '2200px',
    },
    extend: {
      borderWidth: {
        16: '16px',
      },
    },
    fontFamily: {
      sans: ['"Exo 2"', 'sans-serif'],
    },
  },
  plugins: [require('daisyui')],
}
