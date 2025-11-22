/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            // Default orange theme
            yellow: 'var(--color-yellow)',
            orange: 'var(--color-primary)',
            red: 'var(--color-red)',
            lightBlue: 'var(--color-light-blue)',
            blue: 'var(--color-blue)',
            // Dark theme colors (black scheme)
            dark: 'hsl(0 0% 0%)',      // Pure black
            'dark-light': 'hsl(0 0% 5%)',  // Very dark gray
            'dark-lighter': 'hsl(0 0% 10%)', // Dark gray
            // Light theme colors (white scheme)
            light: 'hsl(0 0% 100%)',    // Pure white
            'light-dark': 'hsl(0 0% 95%)',   // Very light gray
            'light-darker': 'hsl(0 0% 90%)', // Light gray
          },
        },
        animation: {
          'fade-in': 'fadeIn 200ms ease-in-out',
          'slide-up': 'slideUp 200ms ease-in-out',
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
        },
      },
    },
    plugins: [],
  };