import type { Action } from "svelte/types/runtime/action";

export const click_outside: Action = (node) => {
	const handle_click = (event: MouseEvent) =>
		node &&
		!node.contains(event.target as HTMLElement) &&
		!event.defaultPrevented &&
		node.dispatchEvent(new CustomEvent("click_outside", node as any));

	document.addEventListener("click", handle_click, true);

	return {
		destroy() {
			document.removeEventListener("click", handle_click, true);
		}
	};
};

export const dark_mode =
	document.querySelector(".gradio-container")?.classList.contains("dark") ??
	document
		.querySelector("gradio-app")
		?.shadowRoot?.querySelector(".gradio-container")
		?.classList.contains("dark") ??
	false;
