// tailwind.config.js
module.exports = {
  // ... other configurations
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
        },
      },
    },
  },
  plugins: [],
};

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        neumorph: {
          light: '#E6E9EF',
          dark: '#D1D9E6',
          shadow: '#BABECC',
          highlight: '#FFFFFF'
        }
      },
      boxShadow: {
        'neumorph-inset': 'inset 2px 2px 5px #BABECC, inset -5px -5px 10px #FFFFFF',
        'neumorph-outset': '3px 3px 6px #BABECC, -3px -3px 6px #FFFFFF',
        'neumorph-pressed': 'inset 1px 1px 2px #BABECC, inset -1px -1px 2px #FFFFFF'
      }
    }
  }
}