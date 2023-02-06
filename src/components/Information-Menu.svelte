<script lang="ts">
	import { Heading, Hr } from 'flowbite-svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import type { Graph, Node, Property } from '../api/graph';
	import LoadingCircle from './util/Loading-Circle.svelte';
	import { paginate, DarkPaginationNav } from 'svelte-paginate';
	import { ArrowTopRightOnSquare, Plus, XMark } from '@steeze-ui/heroicons';
	import { setContext } from 'svelte';
	import { Modal_Manager } from './modal/modal-store';
	import InformationMenuMore from './modal/modals/Information-Menu-More.svelte';

	export let node: Node | undefined;
	export let graph: Graph;

	let node_description: string = '';

	let loading: boolean = false;
	let loading_related: boolean = false;

	let properties: Property[] = [];

	let current_page: number = 1;
	const page_size: number = 8;
	setContext('close', close_modal);

	function close_modal() {
		Modal_Manager.close();
	}

	$: node && load_properties();

	let paginated_properties: Property[] = [];

	$: {
		properties;
		current_page;
		page_size;
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
			const promises = paginated_properties.map((p) => {
				return new Promise<Node[]>((res) => {
					if (!node) return res([]);
					graph.load_related_nodes(node.id, p, false, undefined, false, false).then((nodes) => {
						paginated_properties = paginated_properties;
						return res(nodes);
					});
				});
			});

			const new_nodes = [...new Set((await Promise.all(promises)).flat())];
			graph.load_relations(new_nodes, false, false);

			loading_related = false;
		}
	}

	async function load_properties() {
		if (node) {
			node_description = node.description;
			current_page = 1;
			paginated_properties = paginate({
				items: node.properties,
				pageSize: page_size,
				currentPage: current_page
			});

			if (!node.is_fetched) {
				loading = true;
				if (node_description.length === 0)
					graph.load_node(node.id).then(() => (node_description = node?.description || ''));
				await graph.get_properties(node.id);
			}
			loading = false;
			properties = node?.properties;
		}
	}
	function show_more_handler(property: Property) {
		Modal_Manager.open(InformationMenuMore, { property, graph });
	}
	function add_node(node: Node) {
		graph.show_node(node);
	}
</script>

{#if node}
	<div
		class="p-4 h-4/5 top-1/2 flex flex-col -translate-y-1/2 absolute right-4 w-96 shadow-lg rounded-lg border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<div class="flex justify-between items-center">
			<h1 class="text-lg font-bold truncate">{node.label}</h1>
			<button on:click={() => (node = undefined)}>
				<Icon src={XMark} size="24" />
			</button>
		</div>
		<Hr divClass="my-2" />
		<p class="mb-2">{node_description.length > 0 ? node_description : 'No description'}</p>
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
									<div
										class="flex gap-2 items-center px-2 rounded-lg min-h-[35px] group hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
									>
										<div class="truncate w-10/12" title={node.label}>
											{node.label}
										</div>
										<div
											class="w-2/12 group-hover:opacity-100 flex opacity-0 items-center justify-end transition-all duration-200 ease-in-out"
										>
											<a
												target="_blank"
												rel="noreferrer"
												href={node.id}
												class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
											>
												<Icon src={ArrowTopRightOnSquare} size={'20'} />
											</a>
											<button
												class="p-1 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
												on:click={() => add_node(node)}
											>
												<Icon src={Plus} size={'20'} />
											</button>
										</div>
									</div>
								{/each}
								{#if property.related.length > 5}
									<button
										on:click={() => show_more_handler(property)}
										class="truncate"
										title="... and {property.related.length - 5} more"
										>... and {property.related.length - 5} more</button
									>
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
			{/if}
			{#if loading}
				<div class="w-8 h-8 m-auto">
					<LoadingCircle />
				</div>
			{:else if properties.length === 0 && !loading && node.is_fetched}
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
