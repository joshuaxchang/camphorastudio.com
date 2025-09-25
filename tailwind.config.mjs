/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                'brand-bg': '#F1ECE4', // New background from logo
                'brand-card': '#FCFBF8', // New color for cards
                'brand-text': '#4A4A4A', 
                'brand-primary': '#5F7A52', // New Joshua Tree green
                'brand-primary-hover': '#4C6141', // Darker green for hover
                'brand-accent': '#F1AB50', // New sun yellow
                'brand-accent-light': '#FBEFDD', // Lighter sun yellow for gradient
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                heading: ['Poppins', ...defaultTheme.fontFamily.sans],
                serif: ['EB Garamond', ...defaultTheme.fontFamily.serif],
            },
            boxShadow: {
                'card': '0 6px 16px 0 rgba(74, 74, 74, 0.08)', // Deeper, softer neutral shadow
                'card-hover': '0 10px 30px 0 rgba(74, 74, 74, 0.2)', // Stronger, green-tinted hover shadow
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-headings': theme('colors.brand-text'),
                        '--tw-prose-bold': theme('colors.brand-text'),
                        h1: {
                            color: 'var(--tw-prose-headings)',
                        },
                        h2: {
                            color: 'var(--tw-prose-headings)',
                        },
                        h3: {
                            color: 'var(--tw-prose-headings)',
                        },
                        h4: {
                            color: 'var(--tw-prose-headings)',
                        },
                        h5: {
                            color: 'var(--tw-prose-headings)',
                        },
                        h6: {
                            color: 'var(--tw-prose-headings)',
                        },
                    },
                },
            }),
        },
    },
    plugins: [
        typography,
    ],
}
