/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Hybrid Design System Tokens ---
        primary: 'var(--theme-primary)',
        'primary-hover': 'var(--theme-primary-hover)',
        'on-primary': 'var(--theme-on-primary)',
        
        secondary: 'var(--theme-secondary)',
        'on-secondary': 'var(--theme-on-secondary)',
        
        tertiary: 'var(--theme-tertiary)',
        
        background: 'var(--theme-background)',
        'on-background': 'var(--theme-on-background)',
        
        surface: 'var(--theme-surface)',
        'surface-elevated': 'var(--theme-surface-elevated)',
        'on-surface': 'var(--theme-on-surface)',
        'on-surface-variant': 'var(--theme-on-surface-variant)',
        
        outline: 'var(--theme-outline)',
        'outline-subtle': 'var(--theme-outline-subtle)',

        // Keep some legacy tokens for transition if needed, but point them to variables or sensible defaults
        'primary-container': 'var(--theme-surface-elevated)',
        'on-primary-container': 'var(--theme-on-surface-variant)',
        'surface-container-lowest': 'var(--theme-surface)',
        'surface-container-low': 'var(--theme-surface-low)',
        'surface-container': 'var(--theme-surface)',
        'surface-container-high': 'var(--theme-surface-elevated)',
        'surface-container-highest': 'var(--theme-surface-elevated)',
      },
      borderRadius: {
        'role': 'var(--theme-radius)',
        'role-lg': 'var(--theme-radius-lg)',
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontWeight: {
        'signature': '510',
      },
      letterSpacing: {
        'tightest': '-0.022em',
        'tighter': '-0.011em',
        'wide-base': '0.005em',
      },
      boxShadow: {
        editorial: 'var(--theme-shadow)',
        'hero': '0 24px 48px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
