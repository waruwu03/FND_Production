/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        secondary: '#1E293B',
        accent: '#F97316',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#FFFFFF',
        crewAccent: '#F97316',
        crewBg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['PlusJakartaSans-Regular', 'sans-serif'],
        semibold: ['PlusJakartaSans-SemiBold', 'sans-serif'],
        bold: ['PlusJakartaSans-Bold', 'sans-serif'],
        extrabold: ['PlusJakartaSans-ExtraBold', 'sans-serif'],
        black: ['PlusJakartaSans-ExtraBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
