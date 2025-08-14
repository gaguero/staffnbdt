/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#fefdf9',
          100: '#fdf9f0',
          200: '#faf0d9',
          300: '#f7e7c2',
          400: '#f1d594',
          500: '#f5ebd7', // Sand - Main primary
          600: '#ddd4c3',
          700: '#b8b1a3',
          800: '#948f83',
          900: '#79756b',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#4a4a4a', // Main charcoal
          600: '#404040',
          700: '#2d2d2d',
          800: '#1a1a1a',
          900: '#0d0d0d',
        },
        gold: {
          50: '#faf9f7',
          100: '#f3f1eb',
          200: '#e6e0d4',
          300: '#d4c8b3',
          400: '#bfa98a',
          500: '#aa8e67', // Warm Gold
          600: '#9d7c58',
          700: '#83664a',
          800: '#6b5440',
          900: '#584538',
        },
        // Property-specific colors
        forest: {
          50: '#f4f6f3',
          100: '#e7ebe5',
          200: '#cfd7cb',
          300: '#a8b8a3',
          400: '#8fa186',
          500: '#7c8e67', // Forest Green
          600: '#6a7957',
          700: '#576349',
          800: '#475240',
          900: '#3c4538',
        },
        ocean: {
          50: '#f3f8f9',
          100: '#e1f0f2',
          200: '#c6e1e6',
          300: '#9fcad1',
          400: '#71aab4',
          500: '#a4c4c8', // Ocean Teal
          600: '#8db4b9',
          700: '#7a9fa5',
          800: '#6b8a91',
          900: '#5a7379',
        },
        sky: {
          50: '#f0fffe',
          100: '#dcfef4', // Sky Blue
          200: '#bbfce8',
          300: '#87f7d9',
          400: '#4de8c6',
          500: '#23d4aa',
          600: '#17ad8f',
          700: '#168a74',
          800: '#176e5e',
          900: '#175b4f',
        },
        // Semantic colors
        success: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8fd08f',
          400: '#5ab45a',
          500: '#2e7d32', // Success green
          600: '#236523',
          700: '#1e4f1e',
          800: '#1c3f1c',
          900: '#1a351a',
        },
        warning: {
          50: '#fef7f0',
          100: '#feecdc',
          200: '#fcd4b8',
          300: '#f9b189',
          400: '#f58558',
          500: '#ed6c02', // Warning orange
          600: '#de5502',
          700: '#b84202',
          800: '#923507',
          900: '#762d08',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#c62828', // Error red
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#661b1b',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0277bd', // Info blue
          600: '#0369a1',
          700: '#0c4a6e',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        // Heading font - Gotham Black
        heading: ['Gotham', 'Arial Black', 'sans-serif'],
        // Subheading font - Georgia Italic
        subheading: ['Georgia', 'Times New Roman', 'serif'],
        // Body font - Proxima Nova
        body: ['Proxima Nova', 'Tahoma', 'Arial', 'sans-serif'],
        // Fallbacks
        sans: ['Proxima Nova', 'Tahoma', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        // Typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        // 8px base spacing unit
        '0.5': '2px',   // 0.25 * 8px
        '1': '4px',     // 0.5 * 8px
        '2': '8px',     // 1 * 8px (base)
        '3': '12px',    // 1.5 * 8px
        '4': '16px',    // 2 * 8px
        '5': '20px',    // 2.5 * 8px
        '6': '24px',    // 3 * 8px
        '7': '28px',    // 3.5 * 8px
        '8': '32px',    // 4 * 8px
        '10': '40px',   // 5 * 8px
        '12': '48px',   // 6 * 8px
        '16': '64px',   // 8 * 8px
        '20': '80px',   // 10 * 8px
        '24': '96px',   // 12 * 8px
        '32': '128px',  // 16 * 8px
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'popup': '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'fade-out': 'fadeOut 200ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-in-out',
        'slide-down': 'slideDown 300ms ease-in-out',
        'scale-in': 'scaleIn 200ms ease-in-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};