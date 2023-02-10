import { browser } from '$app/environment';
import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';

const storage = <T extends { [key: string]: any }>(key: string, initValue: T): Writable<T> => {
	const store = writable(initValue);
	if (!browser) return store;
	const local_store_str = localStorage.getItem(key);

	if (local_store_str != null) {
		let value = JSON.parse(local_store_str);
		Object.keys(initValue).forEach((key) => {
			if (value[key] === undefined || value[key] === null) {
				value = { ...value, [key]: initValue[key] };
			}
		});
		store.set(value);
	}

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

		let value: T = JSON.parse(local_store_str);

		if (value !== get(store)) {
			Object.keys(initValue).forEach((key) => {
				if (value[key] === undefined || value[key] === null) {
					value = { ...value, [key]: initValue[key] };
				}
			});
			store.set(value);
		}
	});

	return store;
};

export default storage;

export const languages = {
	en: 'English',
	de: 'Deutsch',
	fr: 'Français',
	es: 'Español',
	it: 'Italiano',
	nl: 'Nederlands',
	pl: 'Polski',
	ru: 'Русский',
	ja: '日本語',
	zh: '中文'
};

export interface Settings {
	advanced_settings: boolean;
	fetch_related: boolean;
	endpoint_url: string;
	endpoint_type: 'wikidata' | 'dbpedia';
	endpoint_lang: keyof typeof languages;
	rate_limit: number;
	size_limit: number;
	fetch_image: boolean;
	animations: boolean;
	hide_edges_on_drag: boolean;
	hide_edge_labels: boolean;
	smooth_edges: boolean;
	smart_search: boolean;
}

export const Settings = storage<Settings>('settings', {
	advanced_settings: false,
	fetch_related: true,
	endpoint_url: 'https://skynet.coypu.org/wikidata/',
	endpoint_type: 'wikidata',
	endpoint_lang: 'en',
	rate_limit: 5,
	size_limit: 100,
	fetch_image: true,
	animations: false,
	hide_edges_on_drag: false,
	hide_edge_labels: false,
	smooth_edges: false,
	smart_search: true
});
