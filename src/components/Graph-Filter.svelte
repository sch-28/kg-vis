<script lang="ts">
	import { Button, Search } from 'flowbite-svelte';
	import { click_outside, fuzzy_search } from '../util';
	import type { Graph, Node } from '../api/graph';
	import { onMount, type SvelteComponent } from 'svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Plus } from '@steeze-ui/heroicons';

	export let graph: Graph;
	export let open: boolean;

	let search_container: HTMLDivElement;
	let search_input: HTMLInputElement;
	let search: string = '';
	let search_results: ReturnType<typeof fuzzy_search<Node>> = [];
	let search_results_open: boolean = false;

	$: {
		if (graph && search.length > 0) {
			search_results = fuzzy_search(graph.data.nodes.get(), search, ['label', 'id']);
			search_results_open = true;
		}
	}

	$: open && search_input && search_input.focus();


	onMount(() => {
		search_input = search_container.querySelector('input')!;
	});
</script>

<div
	bind:this={search_container}
	class="{open
		? 'top-full opacity-100'
		: 'top-0 opacity-0'} z-[49] pointer-events-none duration-200 transition-all absolute mt-4 left-1/2 -translate-x-1/2 w-full"
>
	<div class="flex flex-col w-6/12 mx-auto pointer-events-auto">
		<Search
			on:click={() => {
				console.log('click');
				if (search_results.length > 0) {
					search_results_open = true;
				}
			}}
			class="dark:!bg-dark-bg !bg-white border dark:!border-dark-muted shadow-lg rounded-lg"
			size="md"
			bind:value={search}
			focus={true}
		/>
		<div
			class="mt-1 flex-col border shadow-lg rounded-lg dark:border-dark-muted dark:bg-dark-bg bg-white z-50 w-full divide-y divide-gray-200 dark:divide-gray-700  transition-all duration-200 max-h-60 overflow-y-scroll {search_results_open &&
			search_results.length > 0
				? 'flex'
				: 'hidden'}"
			use:click_outside
			on:click_outside={() => {
				search_results_open = false;
			}}
		>
			{#each search_results as result}
				<button
					class="text-left flex items-center px-2 min-h-[35px] group hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
					on:click={() => {
						graph.network?.selectNodes([result.item.id]);
						graph.network?.focus(result.item.id, { animation: true, scale: 1 });
					}}
				>
					<div class="truncate w-10/12" title={result.item.label}>
						{result.item.label}
					</div>
					<div
						class="w-2/12 group-hover:opacity-100 flex opacity-0 items-center justify-end transition-all duration-200 ease-in-out"
					>
						<button
							class="p-1 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
							on:click={() => null}
						>
							<Icon src={Plus} size={'20'} />
						</button>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>
