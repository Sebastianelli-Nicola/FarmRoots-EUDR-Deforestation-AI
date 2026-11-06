import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        risk: {
          green: '#16a34a',
          amber: '#d97706',
          red:   '#dc2626',
        },
      },
    },
  },
  plugins: [forms],
} satisfies Config
