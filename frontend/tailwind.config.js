/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Wire primary-* utility classes to the CSS variable system
        primary: {
          50:  'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        theme: {
          blue: {
            50: '#e6f1ff', 100: '#b3d7ff', 200: '#80bdff', 300: '#4da3ff',
            400: '#1a89ff', 500: '#0070f3', 600: '#0057c2', 700: '#003e91',
            800: '#002460', 900: '#000b30',
          },
          green: {
            50: '#e6f5f0', 100: '#b3e6d1', 200: '#80d7b2', 300: '#4dc893',
            400: '#1ab974', 500: '#00a85a', 600: '#008a4a', 700: '#006b3b',
            800: '#004d2b', 900: '#002e1c',
          },
          red: {
            50: '#ffe6e6', 100: '#ffb3b3', 200: '#ff8080', 300: '#ff4d4d',
            400: '#ff1a1a', 500: '#f30000', 600: '#c20000', 700: '#910000',
            800: '#600000', 900: '#300000',
          },
          orange: {
            50: '#fff2e6', 100: '#ffdab3', 200: '#ffc280', 300: '#ffab4d',
            400: '#ff941a', 500: '#f37b00', 600: '#c26200', 700: '#914900',
            800: '#603000', 900: '#301800',
          },
        },
      },
    },
  },
  plugins: [],
}
