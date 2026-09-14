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
        sans: ['"IBM Plex Sans Arabic"', '"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Amiri"', '"Playfair Display"', 'Georgia', 'serif'],
        arabic: ['"IBM Plex Sans Arabic"', '"Tajawal"', 'sans-serif'],
      },
      colors: {
        // Terracotta / Clay / Copper - Accent Color (warnings, overdue, navigation active)
        brand: {
          50:  '#fdf5f0',
          100: '#fbe8dc',
          200: '#f5cfba',
          300: '#edac8a',
          400: '#e28159',
          500: '#d4603a',
          600: '#a65f46', // Najdi Terracotta Primary — #A65F46
          700: '#8a4a34',
          800: '#6f3a28',
          900: '#5c301f',
          950: '#361607',
        },
        // Najdi Dark Brown — Deep Sidebar & Navigation
        najdi: {
          950: '#1a0f09',
          900: '#2a1a10', // Deep Brown base — close to #302219
          850: '#352215',
          800: '#4a3426', // Najdi Brown — #4A3426
          700: '#5e4535',
          600: '#745647',
          500: '#8e705f',
          400: '#ab9082',
          300: '#c8b4aa',
          200: '#e0d3cc',
          100: '#f2ece8',
          50:  '#faf6f4',
        },
        // Warm Cream & Off-white — Surfaces & Backgrounds
        cream: {
          50:  '#fffdf8',  // Card background — #FFFDF8
          100: '#f7f1e7',  // Page background — #F7F1E7
          200: '#efe5d4',
          300: '#e0cfb8',
          400: '#ccb597',
          500: '#b59874',
        },
        // Desert Sand — Primary Action Buttons & Accent
        sand: {
          50:  '#fdf9f2',
          100: '#f8efde',
          200: '#f0dfc1',
          300: '#e2c99a',  // Light Sand — #E2C99A
          400: '#d8c3a5',  // Desert Beige — #D8C3A5
          500: '#c9a66b',  // Primary Sand — #C9A66B (PRIMARY BUTTON COLOR)
          600: '#b89255',  // Muted Gold hover — #B89255
          700: '#9a7640',
          800: '#7c5e32',
          900: '#5e4826',
          950: '#3a2c17',
        },
        // Muted Gold / Bronze — Premium Details & Icons
        bronze: {
          50:  '#fbf8f0',
          100: '#f5efda',
          200: '#ebdcb3',
          300: '#dcc47f',
          400: '#c9a84f',
          500: '#b89255',  // Muted Saudi Gold — #B89255
          600: '#9a7640',
          700: '#7c5e32',
          800: '#634c28',
          900: '#523e22',
        },
        // Red exclusively for warnings / overdue
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          950: '#450a0a',
        },
        // Success — secondary use only (not green; kept minimal)
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
