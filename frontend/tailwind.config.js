/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf5',
          100: '#d5f7e5',
          200: '#adecce',
          300: '#76dbb0',
          400: '#3ec18d',
          500: '#1aa572',
          600: '#0f855c',
          700: '#0d6a4c',
          800: '#0d543e',
          900: '#0c4534',
          950: '#04271e',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1b9c9',
          400: '#8691a8',
          500: '#67728c',
          600: '#535c73',
          700: '#444b5e',
          800: '#3b4150',
          900: '#343945',
          950: '#181a20',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Cal Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
        'card-hover': '0 4px 8px rgba(16, 24, 40, 0.08), 0 8px 24px rgba(16, 24, 40, 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
