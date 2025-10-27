/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          950: '#0f172a'
        }
      },
      boxShadow: {
        glow: '0 10px 30px -5px rgba(79, 70, 229, 0.5)'
      }
    }
  },
  plugins: []
};
