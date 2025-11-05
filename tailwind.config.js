/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'brand-primary': {
          DEFAULT: '#FF8C42', // Vibrant Orange
          light: '#FFA56B',
          dark: '#E67E3A',
        },
        'brand-secondary': '#4CAF50', // Positive Green
        'brand-accent': '#FFB84D', // Gold/Yellow
        'brand-danger': '#F44336', // Negative Red
        
        // New structured theme colors
        background: {
          light: '#F9FAFB', // gray-50
          dark: '#111827',  // gray-900
        },
        card: {
          light: '#FFFFFF',
          dark: '#1F2937', // gray-800
        },
        text: {
          primary: {
            light: '#1F2937', // gray-800
            dark: '#F9FAFB',  // gray-50
          },
          secondary: {
            light: '#6B7280', // gray-500
            dark: '#9CA3AF',  // gray-400
          }
        },
        border: {
          light: '#E5E7EB', // gray-200
          dark: '#374151',  // gray-700
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card-light': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-dark': '0 1px 2px 0 rgb(255 255 255 / 0.05)',
      },
      borderRadius: {
          'xl': '0.75rem', // 12px
          '2xl': '1rem', // 16px
      },
      keyframes: {
        fadeIn: {
            'from': { opacity: 0, transform: 'translateY(5px)' },
            'to': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInUp: {
            'from': { opacity: 0, transform: 'translateY(20px)' },
            'to': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}