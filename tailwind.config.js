/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1220',
        panel: '#111b2e',
        accent: '#8b5cf6',
        mint: '#34d399'
      },
      boxShadow: { soft: '0 18px 50px rgba(2, 6, 23, .12)' }
    }
  },
  plugins: []
};
