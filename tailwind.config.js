/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#09090b',
          900: '#121217',
          850: '#18181f',
          800: '#22222b',
          700: '#32323e',
          600: '#464656'
        },
        bms: {
          green: '#1EA83C',
          'green-light': '#2cd954',
          'green-dark': '#137929',
          red: '#f84464',
          yellow: '#f5a623',
          screen: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px -3px rgba(30, 168, 60, 0.45)',
        'glow-screen': '0 0 40px -5px rgba(56, 189, 248, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
