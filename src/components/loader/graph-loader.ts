import { writable } from 'svelte/store';

type LoaderLoading = {
	loading: true;
	state: LoadingState;
	progress?: number;
};

export type Loader =
	| {
			loading: false;
	  }
	| LoaderLoading;

const CurrentLoader = writable<Loader>({ loading: false });

export const LoadingStates = ['related', 'relations', 'stabilizing'] as const;
export type LoadingState = typeof LoadingStates[number];
export const LoadingStatesDescription: Record<LoadingState, string> = {
	related: 'Loading related nodes',
	relations: 'Loading relations',
	stabilizing: 'Stabilizing graph'
};
export abstract class GraphLoader {
	static set_status(state: LoadingState, progress?: number) {
		CurrentLoader.set({ loading: true, state, progress });
	}

	static close() {
		CurrentLoader.set({ loading: false });
	}

	static get store() {
		return CurrentLoader;
	}
}
