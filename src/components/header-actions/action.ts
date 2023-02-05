import type { SvelteComponent } from 'svelte';

export type Action = new (...args: any[]) => SvelteComponent;
