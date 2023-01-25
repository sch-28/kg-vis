<script lang="ts">
	import { Heading, Hr, Pagination, PaginationItem } from 'flowbite-svelte';
	import { SPARQL } from '../api/sparql';
	import type { Graph, Node, Property } from '../api/graph';
	import LoadingCircle from './Loading-Circle.svelte';
	import type { LinkType } from 'flowbite-svelte/types';
	import { page } from '$app/stores';
	import { paginate, DarkPaginationNav } from 'svelte-paginate';

	export let node: Node | undefined;
	export let graph: Graph;

	let loading: boolean = false;
	let loading_related: boolean = false;

	let properties: Property[] = [];

	let current_page: number = 1;
	const page_size: number = 8;

	$: node && load_properties();

	let paginated_properties: Property[] = [];
	$: {
		properties;
		page_size;
		current_page;
		load_related();
	}

	async function load_related() {
		if (node) {
			paginated_properties = paginate({
				items: properties,
				pageSize: page_size,
				currentPage: current_page
			});
			loading_related = true;
			for (const property of paginated_properties) {
				await graph.load_related_nodes(node.id, property, false, undefined, false);
				paginated_properties = paginated_properties;
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
			properties = node.properties;
		}
	}
</script>

{#if node}
	<div
		class="p-4 h-4/5 top-1/2 flex flex-col -translate-y-1/2 absolute right-4 w-96 shadow-lg rounded-lg border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<h1 class="text-lg font-bold">{node.label}</h1>
		<Hr divClass="my-2" />
		<p class="mb-2">{node.description}</p>
		<div class="w-full max-h-full overflow-y-auto overflow-x-hidden flex-grow flex flex-col gap-2">
			{#if node.properties.length > 0}
				{#each paginated_properties as property}
					<div class="flex flex-col relative pt-3">
						<p class="text-sm absolute top-0 left-1 px-1 bg-white dark:bg-dark-bg">
							{property.label}
						</p>
						<div class="w-full border-light dark:border-dark-muted rounded-lg border p-2">
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
			{:else if loading}
				<div class="w-8 h-8 m-auto">
					<LoadingCircle />
				</div>
			{:else}
				<Heading text="No properties found" />
			{/if}
		</div>
		<div class="pagination mt-2">
			<DarkPaginationNav
				totalItems={properties.length}
				pageSize={page_size}
				currentPage={current_page}
				limit={1}
				showStepOptions={true}
				on:setPage={(e) => (current_page = e.detail.page)}
			/>
		</div>
	</div>
{/if}

<style lang="postcss" global>
	.pagination :global(.pagination-nav) {
		@apply !bg-white !rounded-lg !text-sm h-[46px];
	}

	:global(.dark) .pagination :global(.pagination-nav) {
		@apply !bg-dark-muted;
	}

	.pagination :global(.option) {
		@apply !px-2 !py-2 !text-dark;
	}

	:global(.dark) .pagination :global(.option) {
		@apply !px-2 !py-2 !text-light;
	}

	:global(.dark) .pagination :global(.option svg path) {
		@apply !fill-light;
	}
	.pagination :global(.option svg path) {
		@apply !fill-dark;
	}

	.pagination :global(.option.active) {
		@apply !text-primary;
	}

	.pagination :global(.option):hover {
		background: #00000021 !important;
		cursor: pointer;
		margin-top: 5px;
		margin-bottom: 5px;
		padding-top: 0;
		padding-bottom: 0;
		border-radius: 20px !important;
	}
</style>
