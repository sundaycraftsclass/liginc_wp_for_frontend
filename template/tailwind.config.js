const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./*.html",
    "./scripts/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        cyan: colors.cyan,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
