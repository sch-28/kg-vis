import type { Action } from 'svelte/types/runtime/action';
import toast from 'svelte-french-toast';

export const click_outside: Action = (node) => {
	const handle_click = (event: MouseEvent) =>
		node &&
		!node.contains(event.target as HTMLElement) &&
		!event.defaultPrevented &&
		node.dispatchEvent(new CustomEvent('click_outside', node as any));

	document.addEventListener('click', handle_click, true);

	return {
		destroy() {
			document.removeEventListener('click', handle_click, true);
		}
	};
};

export function change_theme(dark: boolean) {
	if (dark) {
		document.documentElement.classList.add('dark');
		dark_mode = true;
	} else {
		document.documentElement.classList.remove('dark');
		dark_mode = false;
	}
}

export const get_theme = () => {
	if (
		localStorage.theme === 'dark' ||
		(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
	) {
		document.documentElement.classList.add('dark');
		return true;
	} else {
		document.documentElement.classList.remove('dark');
		return false;
	}
};

export let dark_mode = get_theme();

export function show_loading_toast(promise: Promise<any>, message: string) {
	toast.promise(
		promise,
		{
			loading: `Loading ${message}...`,
			success: `${message} Loaded!`,
			error: `Error while loading ${message}!`
		},
		{
			position: 'top-right',
			style: `${
				dark_mode ? 'background: #1f2937; color: #fff;' : 'background: #fff; color: #000;'
			} min-width: 200px;`
		}
	);
	document.querySelector('.toaster .message')?.setAttribute('title', message);
}

function measure_scrollbar() {
	const div = document.createElement('div');
	div.style.width = '100px';
	div.style.height = '100px';
	div.style.overflow = 'scroll';
	div.style.position = 'absolute';
	div.style.top = '-9999px';
	document.body.appendChild(div);
	const scrollbarWidth = div.offsetWidth - div.clientWidth;
	document.body.removeChild(div);
	return scrollbarWidth;
}

export const scrollbar_width = measure_scrollbar();
