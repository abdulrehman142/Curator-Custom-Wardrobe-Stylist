/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#231212',
          hover: '#422727',
        },
        neutral: {
          light: '#CCCCCC',
          medium: '#E5E5E5',
          soft: '#F3F3F3',
        },
      },
      fontFamily: {
        display: ['var(--font-jersey)', 'sans-serif'],
        body: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      fontSize: {
        'heading-mobile': '24px',
        'heading-desktop': '32px',
        'body': '14px',
        'body-lg': '16px',
        'small': '12px',
        'small-lg': '14px',
      },
      spacing: {
        'section-mobile': '24px',
        'section-desktop': '48px',
        'component': '8px',
        'component-lg': '16px',
      },
      borderRadius: {
        'md': '0.375rem',
      },
      boxShadow: {
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      transitionDuration: {
        'smooth': '250ms',
      },
    },
  },
  plugins: [],
}

