<script lang="ts">
	import { SPARQL } from '../api/sparql';
	import { dark_mode } from '../util';
	import toast from 'svelte-french-toast';

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
				style: `${dark_mode ? 'background: #1f2937; color: #fff;' : 'background: #fff; color: #000;'} min-width: 200px;`
			}
		);
	}

	SPARQL.on('loading_properties', (promise) => {
		show_toast('Properties', promise);
	});
	SPARQL.on('loading_related', (promise) => {
		show_toast('Related', promise);
	});
	SPARQL.on('loading_relations', (promise) => {
		show_toast('Relations', promise);
	});
</script>
