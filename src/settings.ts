import { browser } from '$app/environment';
import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';

const storage = <T>(key: string, initValue: T): Writable<T> => {
	const store = writable(initValue);
	if (!browser) return store;
	const local_store_str = localStorage.getItem(key);

	if (local_store_str != null) store.set(JSON.parse(local_store_str));

	store.subscribe((val) => {
		if (val == null || val == undefined) {
			localStorage.removeItem(key);
		} else {
			localStorage.setItem(key, JSON.stringify(val));
		}
	});

	window.addEventListener('storage', () => {
		const local_store_str = localStorage.getItem(key);

		if (local_store_str == null) return;

		const local_value: T = JSON.parse(local_store_str);

		if (local_value !== get(store)) store.set(local_value);
	});

	return store;
};

export default storage;

export interface Settings {
	advanced_settings: boolean;
	advanced_settings_height: number;
	fetch_related: boolean;
	endpoint_url: string;
	rate_limit: number;
	size_limit: number;
    fetch_image: boolean;
}

export const Settings = storage<Settings>('settings', {
	advanced_settings: false,
	advanced_settings_height: 258,
	fetch_related: true,
	endpoint_url: 'https://skynet.coypu.org/wikidata/',
	rate_limit: 20,
	size_limit: 100,
    fetch_image: false,
});
