/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Stitch Design System: Material You tokens ---
        primary: '#000000',
        'primary-fixed': '#dae2fd',
        'primary-fixed-dim': '#bec6e0',
        'primary-container': '#131b2e',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#131b2e',
        'on-primary-fixed-variant': '#3f465c',
        'on-primary-container': '#7c839b',
        'inverse-primary': '#bec6e0',

        secondary: '#006a61',
        'secondary-fixed': '#89f5e7',
        'secondary-fixed-dim': '#6bd8cb',
        'secondary-container': '#86f2e4',
        'on-secondary': '#ffffff',
        'on-secondary-fixed': '#00201d',
        'on-secondary-fixed-variant': '#005049',
        'on-secondary-container': '#006f66',

        tertiary: '#000000',
        'tertiary-fixed': '#6ffbbe',
        'tertiary-fixed-dim': '#4edea3',
        'tertiary-container': '#002113',
        'on-tertiary': '#ffffff',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#005236',
        'on-tertiary-container': '#009668',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        background: '#f7f9fb',
        'on-background': '#191c1e',

        surface: '#f7f9fb',
        'surface-bright': '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-variant': '#e0e3e5',
        'surface-tint': '#565e74',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#45464d',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',

        outline: '#76777d',
        'outline-variant': '#c6c6cd',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
        // Tailwind defaults for 2xl, 3xl, etc. remain intact
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0 4px 24px rgba(25, 28, 30, 0.04)',
        'hero': '0 24px 48px rgba(25, 28, 30, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
