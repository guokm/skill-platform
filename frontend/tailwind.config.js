/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          ink: '#101a26',
          panel: '#f5efe4',
          sand: '#e7d8c7',
          coral: '#dd7d57',
          teal: '#1d6f70',
          moss: '#3c6b4e',
          line: '#d6c6b2',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        display: ['Fraunces', '"Songti SC"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
