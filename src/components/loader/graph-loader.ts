import { writable } from 'svelte/store';

export type Loader = {
	visible: boolean;
	state?: LoadingState;
	progress?: number;
};

const CurrentLoader = writable<Loader>({ visible: false });

export const LoadingStates = ['related', 'relations', 'stabilizing'] as const;
export type LoadingState = typeof LoadingStates[number];
export const LoadingStatesDescription: Record<LoadingState, string> = {
	related: 'Loading related nodes',
	relations: 'Loading relations',
	stabilizing: 'Stabilizing graph'
};
export abstract class LoaderManager {
	static set_status(state: LoadingState, progress?: number) {
		CurrentLoader.update((s) => ({ ...s, state, progress }));
	}

	static close() {
		CurrentLoader.set({ visible: false });
	}

	static open() {
		CurrentLoader.update((s) => ({ ...s, visible: true }));
	}

	static get store() {
		return CurrentLoader;
	}
}
