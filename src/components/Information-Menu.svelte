<script lang="ts">
	import { Heading, Hr } from 'flowbite-svelte';
	import { SPARQL } from '../api/sparql';
	import type { Graph, Node } from '../api/graph';
	import LoadingCircle from './Loading-Circle.svelte';
	export let node: Node | undefined;
	export let graph: Graph;

	let loading: boolean = false;
	let page: number = 0;
	const page_size: number = 8;

	$: node && load_properties();

	async function load_properties() {
		if (node) {
			if (node.properties.length === 0) {
				loading = true;
				await graph.get_properties(node.id);
			}
			loading = false;
		}
	}
</script>

{#if node}
	<div
		class="p-4 h-4/5 top-1/2 flex flex-col -translate-y-1/2 absolute right-4 w-80 shadow-lg rounded-lg border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<h1 class="text-lg font-bold">{node.label}</h1>
		<Hr divClass="my-2" />
		<p class="mb-2">{node.description}</p>
		<div class="w-full max-h-full overflow-auto flex-grow flex flex-col gap-2">
			{#if node.properties.length > 0}
				{#each node.properties.slice(page * page_size, page * page_size + page_size) as property}
					<div class="flex flex-col relative pt-3">
						<p class="text-sm absolute top-0 left-1 px-1 bg-white dark:bg-dark-bg">
							{property.label}
						</p>
						<div class="w-full border-dark-muted rounded-lg border p-2">No entries found</div>
					</div>
				{/each}
			{:else if loading}
				<div class="w-8 h-8 m-auto">
					<LoadingCircle />
				</div>
			{:else}
				<Heading text="No properties found" />
			{/if}
		</div>
	</div>
{/if}
