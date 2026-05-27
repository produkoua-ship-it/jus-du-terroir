module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        'terroir-primary': '#C8265A',
        'terroir-secondary': '#240F2E',
        'terroir-accent': '#F39C12',
        'terroir-success': '#6CA742',
        'terroir-bg': '#F8F9FE',
      },
      borderRadius: {
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    }
  }
}
