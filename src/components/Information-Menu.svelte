<script lang="ts">
	import { Heading, Hr, Pagination, PaginationItem } from 'flowbite-svelte';
	import { SPARQL } from '../api/sparql';
	import type { Graph, Node, Property } from '../api/graph';
	import LoadingCircle from './Loading-Circle.svelte';
	import type { LinkType } from 'flowbite-svelte/types';
	import { page } from '$app/stores';
	export let node: Node | undefined;
	export let graph: Graph;

	let loading: boolean = false;
	let loading_related: boolean = false;
	let current_page: number = 0;
	const page_size: number = 8;
	let pages: LinkType[] = [];

	let properties: Property[] = [];
	$: node && load_properties();

	$: {
		current_page;
		load_related();
	}

	async function load_related() {
		if (node) {
			properties = node.properties.slice(
				current_page * page_size,
				current_page * page_size + page_size
			);
			console.log(properties);
			loading_related = true;
			for (const property of properties) {
				await graph.load_related_nodes(node.id, property, false, undefined, false);
				properties = properties;
			}
			loading_related = false;
		}
	}

	async function load_properties() {
		if (node) {
			if (node.properties.length === 0) {
				loading = true;
				await graph.get_properties(node.id);
			}
			loading = false;
			pages = new Array(Math.ceil(node.properties.length / page_size))
				.fill(undefined)
				.map((_, i) => ({
					name: i + 1,
					href: `?page=${i + 1}`
				}));
			await load_related();
		}
	}

	$: active_url = $page.url.searchParams.get('page');
	$: {
		pages.forEach((page) => {
			if (page.name.toString() === active_url) {
				page.active = true;
				current_page = page.name - 1;
			} else {
				page.active = false;
			}
		});
		pages = pages;
	}
</script>

{#if node}
	<div
		class="p-4 h-4/5 top-1/2 flex flex-col -translate-y-1/2 absolute right-4 w-80 shadow-lg rounded-lg border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<h1 class="text-lg font-bold">{node.label}</h1>
		<Hr divClass="my-2" />
		<p class="mb-2">{node.description}</p>
		<div class="w-full max-h-full overflow-y-auto overflow-x-hidden flex-grow flex flex-col gap-2">
			{#if node.properties.length > 0}
				{#each properties as property}
					<div class="flex flex-col relative pt-3">
						<p class="text-sm absolute top-0 left-1 px-1 bg-white dark:bg-dark-bg">
							{property.label}
						</p>
						<div class="w-full border-dark-muted rounded-lg border p-2">
							{#if property.related && property.related.length > 0}
								{#each property.related.slice(0, 5) as node}
									<div class="truncate" title={node.label}>
										{node.label}
									</div>
								{/each}
								{#if property.related.length > 5}
									<div class="truncate" title="... and more">... and more</div>
								{/if}
							{:else if loading_related}
								<div class="h-4 w-4 m-auto">
									<LoadingCircle />
								</div>
							{:else}
								No related nodes
							{/if}
						</div>
					</div>
				{/each}
				<Pagination
					{pages}
					on:previous={() => current_page > 0 && current_page--}
					on:next={() => current_page < pages.length && current_page++}
				/>
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
