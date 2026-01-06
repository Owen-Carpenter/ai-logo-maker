/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Professional blue palette
        'primary': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Base blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        
        // Light blue accent palette
        'accent': {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Base light blue
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        
        // Professional gray palette
        'neutral': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        
        // Keep midnight for backward compatibility
        'midnight': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0A0A0A',
        },
        
        // Legacy color mappings for compatibility
        'sunset': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        
        'coral': {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        
        // Gradient stop colors
        'gradient': {
          'blue-start': '#60A5FA',
          'blue-mid': '#3B82F6',
          'blue-end': '#2563EB',
          'light-start': '#7DD3FC',
          'light-mid': '#38BDF8',
          'light-end': '#0EA5E9',
          'dark-start': '#F5F5F5',
          'dark-mid': '#FAFAFA',
          'dark-end': '#FFFFFF',
        }
      },
      
      // Custom gradient configurations - professional blue theme
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
        'coral-gradient': 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)',
        'midnight-gradient': 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 50%, #FFFFFF 100%)',
        'aurora-gradient': 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 50%, #2563EB 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
        'dark-gradient': 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 70%, #FFFFFF 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center bottom, var(--tw-gradient-stops))',
      },
      
      // Custom animations for scroll effects - Webflow-style professional animations
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        'fade-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        'border': {
          'to': { '--border-angle': '360deg' }
        },
        'float': {
          '0%': {
            transform: 'translateY(0px) translateX(0px)'
          },
          '25%': {
            transform: 'translateY(-15px) translateX(10px)'
          },
          '50%': {
            transform: 'translateY(-25px) translateX(-5px)'
          },
          '75%': {
            transform: 'translateY(-10px) translateX(-15px)'
          },
          '100%': {
            transform: 'translateY(0px) translateX(0px)'
          }
        },
        'float-organic-1': {
          '0%, 100%': { 
            transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)',
            opacity: '0.65'
          },
          '15%': { 
            transform: 'translateY(-12px) translateX(8px) rotate(2deg) scale(1.02)',
            opacity: '0.75'
          },
          '35%': { 
            transform: 'translateY(-22px) translateX(12px) rotate(4deg) scale(1.05)',
            opacity: '0.85'
          },
          '50%': { 
            transform: 'translateY(-28px) translateX(-6px) rotate(-2deg) scale(1.03)',
            opacity: '0.9'
          },
          '70%': { 
            transform: 'translateY(-18px) translateX(-14px) rotate(5deg) scale(1.01)',
            opacity: '0.8'
          },
          '85%': { 
            transform: 'translateY(-8px) translateX(4px) rotate(-1deg) scale(1)',
            opacity: '0.7'
          },
        },
        'float-organic-2': {
          '0%, 100%': { 
            transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)',
            opacity: '0.6'
          },
          '20%': { 
            transform: 'translateY(-15px) translateX(-10px) rotate(-3deg) scale(1.03)',
            opacity: '0.75'
          },
          '40%': { 
            transform: 'translateY(-26px) translateX(8px) rotate(3deg) scale(1.06)',
            opacity: '0.85'
          },
          '60%': { 
            transform: 'translateY(-32px) translateX(-12px) rotate(-4deg) scale(1.04)',
            opacity: '0.9'
          },
          '75%': { 
            transform: 'translateY(-14px) translateX(16px) rotate(2deg) scale(1.02)',
            opacity: '0.75'
          },
          '90%': { 
            transform: 'translateY(-4px) translateX(-2px) rotate(-1deg) scale(1)',
            opacity: '0.65'
          },
        },
        'float-organic-3': {
          '0%, 100%': { 
            transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)',
            opacity: '0.65'
          },
          '18%': { 
            transform: 'translateY(-18px) translateX(14px) rotate(3deg) scale(1.04)',
            opacity: '0.8'
          },
          '38%': { 
            transform: 'translateY(-30px) translateX(-8px) rotate(-2deg) scale(1.07)',
            opacity: '0.9'
          },
          '58%': { 
            transform: 'translateY(-36px) translateX(10px) rotate(4deg) scale(1.05)',
            opacity: '0.95'
          },
          '72%': { 
            transform: 'translateY(-20px) translateX(-16px) rotate(-3deg) scale(1.02)',
            opacity: '0.8'
          },
          '88%': { 
            transform: 'translateY(-6px) translateX(6px) rotate(1deg) scale(1)',
            opacity: '0.7'
          },
        },
        'scroll-rtl': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        'scroll-ltr': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
      },
      
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.8s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.8s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.8s ease-out forwards',
        'scale-in': 'scale-in 0.8s ease-out forwards',
        'border': 'border 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 1.2s ease-out forwards',
        'float-organic-1': 'float-organic-1 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-organic-2': 'float-organic-2 14s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-organic-3': 'float-organic-3 16s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll-rtl': 'scroll-rtl 60s linear infinite',
        'scroll-ltr': 'scroll-ltr 60s linear infinite',
        'pause': 'none',
      }
    },
  },
  plugins: [],
} 