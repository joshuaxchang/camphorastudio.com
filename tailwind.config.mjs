/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                'brand-bg': '#F7FBFF',        // A much lighter, almost-white sky blue
				'brand-card': '#FFFFFF',      // Keep pure white for cards
				'brand-text': '#6D5D4D',       // A lighter, warmer brown with a hint of yellow
				'brand-primary': '#4C8562',    // A softer, more muted camphor green
				'brand-primary-hover': '#3E6B50', // A corresponding darker shade for hover
				'brand-accent': '#C9B5A3',      // A much lighter, sandy bark color
				'brand-accent-light': '#F0F3F5', // A very light, neutral accent for subtle contrast

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
