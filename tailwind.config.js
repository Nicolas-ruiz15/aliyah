/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Colores del tema judío ortodoxo sionista
      colors: {
        // Colores principales de Israel
        'tekhelet': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9ddff',
          300: '#7cc3ff',
          400: '#36a4ff',
          500: '#0b86f7',
          600: '#0069d4',
          700: '#0055ab',
          800: '#00478d',
          900: '#003d74',
          950: '#0033CC', // Tekhelet tradicional
        },
        'israel-blue': {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#b8d8ff',
          300: '#78b8ff',
          400: '#2e95ff',
          500: '#0077ff',
          600: '#0059df',
          700: '#0046b4',
          800: '#003d94',
          900: '#0038B8', // Azul de la bandera
          950: '#002871',
        },
        'tallit-white': '#FAFAFA',
        'gold-accent': {
          50: '#fffcf0',
          100: '#fff8d6',
          200: '#fff0ad',
          300: '#ffe373',
          400: '#ffd53a',
          500: '#FFD700', // Oro tradicional
          600: '#e6c200',
          700: '#cc9f00',
          800: '#b8850a',
          900: '#996d0c',
          950: '#5c3f02',
        },
        
        // Sistema de colores extendido
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // Tipografías para hebreo y español
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'hebrew': ['David', 'Frank Rühl CLM', 'Times New Roman', 'serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      
      // Espaciado específico para diseño ortodoxo
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Animaciones suaves para transiciones
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s infinite",
        "shimmer": "shimmer 2s infinite",
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      
      // Sombras suaves para elementos judíos
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'tekhelet': '0 4px 16px rgba(0, 51, 204, 0.2)',
        'gold': '0 4px 16px rgba(255, 215, 0, 0.3)',
      },
      
      // Gradientes temáticos
      backgroundImage: {
        'israel-gradient': 'linear-gradient(135deg, #0038B8 0%, #0033CC 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'prayer-gradient': 'linear-gradient(135deg, #FAFAFA 0%, #F0F7FF 100%)',
        'torah-pattern': "url('/images/torah-pattern.svg')",
      },
      
      // Bordeados especiales
      borderRadius: {
        'xl-custom': '1.25rem',
        '2xl-custom': '1.75rem',
      },
      
      // Medidas para layouts responsivos RTL
      screens: {
        'xs': '475px',
        'rtl': {'raw': '[dir="rtl"]'},
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
    // Plugin para soporte RTL
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        '.text-start': {
          'text-align': 'start',
        },
        '.text-end': {
          'text-align': 'end',
        },
      };
      
      const newComponents = {
        '.btn-primary': {
          '@apply bg-tekhelet-950 text-white px-6 py-3 rounded-lg hover:bg-tekhelet-800 transition-colors duration-200 font-medium': {},
        },
        '.btn-secondary': {
          '@apply bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium': {},
        },
        '.btn-gold': {
          '@apply bg-gold-accent-500 text-gray-900 px-6 py-3 rounded-lg hover:bg-gold-accent-400 transition-colors duration-200 font-medium': {},
        },
        '.card-orthodox': {
          '@apply bg-white rounded-xl shadow-soft border border-gray-100 p-6': {},
        },
        '.input-orthodox': {
          '@apply w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tekhelet-500 focus:border-transparent transition-all duration-200': {},
        },
        '.hebrew-text': {
          '@apply font-hebrew text-right rtl': {},
        },
        '.gradient-israel': {
          '@apply bg-israel-gradient text-white': {},
        },
        '.gradient-gold': {
          '@apply bg-gold-gradient text-gray-900': {},
        },
      };
      
      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};