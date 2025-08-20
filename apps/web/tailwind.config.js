/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        sand: '#F5EBD7',
        charcoal: '#4A4A4A',
        'warm-gold': '#AA8E67',
        
        // Property-specific colors
        'forest-green': '#7C8E67',
        'ocean-teal': '#A4C4C8',
        'sky-blue': '#DCFEF4',
        
        // Semantic colors
        success: '#2E7D32',
        warning: '#ED6C02',
        error: '#C62828',
        info: '#0277BD',
        
        // Additional UI colors
        primary: {
          50: '#FCFAF8',
          100: '#F5EBD7',
          200: '#E8D5B7',
          300: '#DBBF97',
          400: '#CEA977',
          500: '#AA8E67',
          600: '#8B7555',
          700: '#6C5C43',
          800: '#4D4331',
          900: '#2E2A1F'
        },
        gray: {
          50: '#F9F9F9',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#A0A0A0',
          500: '#808080',
          600: '#606060',
          700: '#4A4A4A',
          800: '#303030',
          900: '#1A1A1A'
        }
      },
      fontFamily: {
        'heading': ['Gotham Black', 'Tahoma', 'Arial', 'sans-serif'],
        'subheading': ['Georgia', 'serif'],
        'body': ['Proxima Nova', 'Tahoma', 'Arial', 'sans-serif'],
        'sans': ['Proxima Nova', 'Tahoma', 'Arial', 'sans-serif'],
        'serif': ['Georgia', 'serif']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        'DEFAULT': '0.75rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-out': 'fadeInOut 3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInOut: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '10%, 90%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    })
  ],
}