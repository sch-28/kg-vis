import type { SvelteComponent } from 'svelte';
import { bind } from 'svelte-simple-modal';
import { get, writable } from 'svelte/store';

export type Component = new (...args: any[]) => SvelteComponent;

const Current_Modal = writable<Component | null>(null);

export abstract class Modal_Manager {
	static open(modal: Component, props: Record<string, any> = {}) {
		if (get(Current_Modal) === modal) Current_Modal.set(null);
		else Current_Modal.set(bind(modal as any, props) as unknown as Component);
	}

	static close() {
		Current_Modal.set(null);
	}

	static get store() {
		return Current_Modal;
	}
}
