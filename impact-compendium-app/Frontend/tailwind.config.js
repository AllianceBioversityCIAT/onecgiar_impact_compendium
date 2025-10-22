/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--ic-color-primary)',
        accent: 'var(--ic-color-accent)',
        neutral: 'var(--ic-color-neutral)',
        surface: 'var(--ic-surface)',
        'surface-muted': 'var(--ic-surface-muted)',
        border: 'var(--ic-border)',
      },
      fontFamily: {
        sans: 'var(--ic-font-family)',
      },
      spacing: {
        '18': '4.5rem',
      }
    },
  },
  plugins: [],
}
