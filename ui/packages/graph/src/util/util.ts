import type { Action, ActionReturn } from "svelte/types/runtime/action";

export const click_outside: Action = (node) => {
	const handleClick = (event: MouseEvent) =>
		node &&
		!node.contains(event.target as HTMLElement) &&
		!event.defaultPrevented &&
		node.dispatchEvent(new CustomEvent("click_outside", node as any));

	document.addEventListener("click", handleClick, true);

	return {
		destroy() {
			document.removeEventListener("click", handleClick, true);
		}
	};
};
