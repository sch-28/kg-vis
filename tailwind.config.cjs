const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}', "./node_modules/flowbite/**/*.js"],
	theme: {
		extend: {
			colors: {
				'light-muted': '#94a3b8',
				light: '#e2e8f0',
				'dark-muted': '#334155',
				dark: '#0f172a',
				primary: '#1a73e8'
			},
			boxShadow: {
				inset: 'inset 1px 0px 4px 1px #00000026'
			}
		}
	},
	plugins: [require('flowbite/plugin')],
	darkMode: 'class'
};
