/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand colors
        primary: {
          50: '#e8f5f0',
          100: '#d1ebe3',
          200: '#a3d6c7',
          300: '#75c1ab',
          400: '#47ac8f',
          500: '#1a9b72',
          600: '#147a5a',
          700: '#0f5942',
          800: '#0a382b',
          900: '#051814',
        },
        // Semantic colors
        success: {
          50: '#e9fbef',
          100: '#ccefdb',
          200: '#9fe0c7',
          300: '#70d1b3',
          400: '#41c29f',
          500: '#22a44f',
          600: '#1b833f',
          700: '#14622f',
          800: '#0d411f',
          900: '#06210f',
        },
        warning: {
          50: '#fff6df',
          100: '#ffedc4',
          200: '#ffdb89',
          300: '#ffc94e',
          400: '#ffb713',
          500: '#ff9f2f',
          600: '#cc7f26',
          700: '#995f1d',
          800: '#663f14',
          900: '#331f0b',
        },
        danger: {
          50: '#fff1f3',
          100: '#ffe0e6',
          200: '#ffc0cd',
          300: '#ffa0b4',
          400: '#ff809b',
          500: '#ef5b7a',
          600: '#bf4962',
          700: '#8f374a',
          800: '#5f2532',
          900: '#2f1319',
        },
        // Neutral colors
        neutral: {
          50: '#fafbfc',
          100: '#f4f6f8',
          200: '#e9edf1',
          300: '#dde3e9',
          400: '#d1d9e1',
          500: '#c5cfd9',
          600: '#a8b5c2',
          700: '#8b9aab',
          800: '#6e7f94',
          900: '#51647d',
        },
        // Dark mode colors
        dark: {
          bg: '#0a0e14',
          surface: '#11161f',
          border: '#1e2532',
          text: '#e8eaed',
          muted: '#8b9aab',
        },
      },
      borderRadius: {
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '28px',
        '3xl': '32px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 32px rgba(0, 0, 0, 0.16)',
        'glow': '0 0 20px rgba(26, 155, 114, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
