<script lang="ts">
	import { SPARQL } from '../api/sparql';
	import { dark_mode } from '../util';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	function show_toast(message: string, promise: Promise<void>) {
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

	/* SPARQL.on('loading_properties', (promise) => {
		show_toast('Properties', promise);
	}); */

	onMount(() => {
		if (SPARQL.listenerCount('loading_related') > 0) return;
		SPARQL.on('loading_related', (promise) => {
			show_toast('Related', promise);
		});
		SPARQL.on('loading_relations', (promise) => {
			show_toast('Relations', promise);
		});
		SPARQL.on('error', (error) => {
			show_toast(error.message, Promise.reject());
		});
	});
</script>

<style>
	:global(.toaster .message) {
		overflow: hidden;
		display: -webkit-box !important;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}
</style>
