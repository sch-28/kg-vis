<script lang="ts">
	import {
		Button,
		Chevron,
		Dropdown,
		DropdownItem,
		Label,
		Range,
		Search,
		Toggle,
		ToolbarButton
	} from 'flowbite-svelte';
	import { click_outside, dark_mode, fuzzy_search } from '../util';
	import { onDestroy, onMount } from 'svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Plus, XMark } from '@steeze-ui/heroicons';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { CurrentGraph, type Node, type NodeFilter } from '../api/graph';
	import Graph from './Graph.svelte';
	import { noop } from 'svelte/internal';
	import { Modal_Manager } from './modal/modal-store';
	import ConfirmDialog from './modal/modals/Confirm-Dialog.svelte';

	export let open: boolean;

	let search_container: HTMLDivElement;
	let search_input: HTMLInputElement;
	let search_text: string = '';
	let search_results: {
		button?: HTMLButtonElement;
		result: ReturnType<typeof fuzzy_search<Node>>[number];
	}[] = [];
	let search_results_open: boolean = false;
	let selected_result: number = -1;
	let last_click: number = -1;

	$: {
		if ($CurrentGraph && search_text.length > 0) {
			search();
		}
	}

	function search() {
		search_results = fuzzy_search(
			$CurrentGraph.nodes.filter((n) => n.visible),
			search_text,
			['label', 'id']
		).map((item) => ({ button: undefined, result: item }));
	}

	$: {
		if (open && search_input) {
			focus_search();
		}
	}

	function focus_search() {
		if (search_input) {
			search_input.focus();
			search_results_open = true;
		}
	}

	function search_keybindings(event: KeyboardEvent) {
		if (
			event.code === 'KeyF' &&
			event.ctrlKey &&
			!document.querySelector('#property-menu')?.hasAttribute('focus')
		) {
			event.preventDefault();
			open = !open || !search_results_open;
			if (open) {
				focus_search();
			}
		} else if (event.code === 'Escape' && open) {
			event.preventDefault();
			open = false;
		} else if (event.code === 'ArrowDown' && search_results_open) {
			event.preventDefault();
			if (search_results.length > 0) {
				if (selected_result < search_results.length - 1) {
					selected_result++;
				}
				if (search_results[selected_result].button) {
					search_results[selected_result].button?.focus();
					search_results[selected_result].button?.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest'
					});
				}
			}
		} else if (event.code === 'ArrowUp' && search_results_open) {
			event.preventDefault();
			if (search_results.length > 0) {
				if (selected_result > 0) {
					selected_result--;
				} else if (selected_result === 0) {
					selected_result = -1;
					search_input.focus();
				}
				if (search_results[selected_result].button) {
					search_results[selected_result].button?.focus();
					search_results[selected_result].button?.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest'
					});
				}
			}
		} else if (event.code === 'Enter' && search_results_open) {
			event.preventDefault();
			if (search_results.length > 0) {
				if (search_results[selected_result].button) {
					if (last_click === selected_result) {
						search_results[selected_result].button?.querySelector('button')?.click();
						last_click = -1;
					} else {
						search_results[selected_result].button?.click();
						last_click = selected_result;
					}
				}
			}
		}
	}

	onMount(() => {
		search_input = search_container.querySelector('input')!;
		document.addEventListener('keydown', search_keybindings);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', search_keybindings);
	});

	function update_filter() {
		$CurrentGraph.refresh_filters();
		$CurrentGraph.node_filters = $CurrentGraph.node_filters;
	}

	function delete_filter(node: Node) {
		$CurrentGraph.remove_filter(node);
		$CurrentGraph = $CurrentGraph;
	}

	function prune(filter: NodeFilter) {
		selected_filter_dropdown = undefined;
		$CurrentGraph.node_filters = $CurrentGraph.node_filters;
		Modal_Manager.open(ConfirmDialog, {
			message: `Are you sure you want to delete all nodes that are not in the ${filter.node.label} filter?`,
			on_confirm: () => {
				$CurrentGraph.prune(filter);
			}
		});
	}

	let selected_filter: NodeFilter | undefined = undefined;
	let selected_filter_dropdown: NodeFilter | undefined = undefined;
	let last_closed: NodeFilter | undefined = undefined;
</script>

<div
	bind:this={search_container}
	class="{open
		? 'top-full opacity-100'
		: 'top-0 opacity-0'} z-[49] pointer-events-none duration-200 transition-all absolute mt-4 left-1/2 -translate-x-1/2 w-full {$CurrentGraph
		?.node_filters.length > 0
		? 'grid grid-cols-2 gap-2'
		: ''}"
>
	<div
		class="flex flex-col relative {$CurrentGraph?.node_filters.length > 0
			? 'w-full'
			: 'mx-auto w-56'} pointer-events-auto h-fit"
	>
		<Search
			on:click={() => {
				search_results_open = true;
			}}
			class="dark:!bg-dark-bg !bg-white border dark:!border-dark-muted shadow-lg rounded-lg"
			size="md"
			bind:value={search_text}
			focus={true}
		/>
		<div
			class="mt-1 flex-col border shadow-lg rounded-lg dark:border-dark-muted dark:bg-dark-bg bg-white z-50 w-full divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-scroll min-w-0 {search_results_open &&
			search_results.length > 0
				? 'flex'
				: 'hidden'}"
			use:click_outside
			on:click_outside={() => {
				search_results_open = false;
			}}
		>
			{#each search_results as search}
				<button
					bind:this={search.button}
					class="min-w-0 text-left flex items-center px-2 min-h-[35px] group hover:bg-black/5 dark:hover:bg-black/30 justify-between focus:bg-black/5 dark:focus:bg-black/30 !outline-none"
					on:click={() => {
						$CurrentGraph.network?.selectNodes([search.result.item.id]);
						$CurrentGraph.network?.focus(search.result.item.id, { animation: true, scale: 1 });
					}}
				>
					<div class="truncate min-w-0" title={search.result.item.label}>
						{search.result.item.label}
					</div>
					<div
						class="group-hover:opacity-100 flex opacity-0 items-center justify-end transition-all duration-200 ease-in-out"
					>
						<button
							class="p-1 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
							on:click={(e) => {
								e.stopPropagation();
								$CurrentGraph.add_filter(search.result.item);
								search_results_open = false;
								$CurrentGraph = $CurrentGraph;
							}}
						>
							<Icon src={Plus} size={'20'} />
						</button>
					</div>
				</button>
			{/each}
		</div>
		{#if selected_filter !== undefined}
			<div
				class="absolute pointer-events-auto left-0 w-full"
				use:click_outside
				on:click_outside={() => {
					last_closed = selected_filter;
					selected_filter = undefined;
					setTimeout(() => {
						last_closed = undefined;
					}, 0);
				}}
			>
				<ColorPicker
					isPopup={false}
					label=""
					bind:hex={selected_filter.color}
					isOpen={true}
					on:input={update_filter}
				/>
			</div>
		{/if}
	</div>

	{#if $CurrentGraph && $CurrentGraph.node_filters.length > 0}
		<div
			class="pointer-events-auto z-[49] duration-200 transition-all flex flex-col gap-2 h-fit max-h-[405px] overflow-auto"
		>
			{#each $CurrentGraph.node_filters as filter}
				<div
					class="border shadow-lg rounded-lg dark:border-dark-muted dark:bg-dark-bg bg-white flex flex-col p-2 gap-1"
				>
					<span class="flex">
						<p class="truncate">
							{filter.node.label}
						</p>

						<ToolbarButton class="ml-auto">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-5 h-5"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
								/></svg
							>
						</ToolbarButton>
						<Dropdown
							frameClass="[&_ul]:py-0 !rounded-lg overflow-hidden"
							open={selected_filter_dropdown === filter}
						>
							<DropdownItem>Copy SPARQL</DropdownItem>
							<DropdownItem on:click={() => prune(filter)}>Prune other</DropdownItem>
							<DropdownItem
								on:click={() => delete_filter(filter.node)}
								defaultClass="font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-error dark:text-error-dark"
								>Delete filter</DropdownItem
							>
						</Dropdown>
					</span>

					<div class="flex flex-col gap-1">
						<Label>Range {filter.range}</Label>
						<div class="flex items-baseline gap-1">
							<Range
								min={1}
								max={5}
								step={1}
								bind:value={filter.range}
								on:change={update_filter}
								size="md"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<Label>Visible</Label>
						<Toggle
							bind:checked={filter.visible}
							on:change={() => {
								//todo optimize, this is a hack to show the changes & appy colors
								update_filter();
								if (filter.visible) update_filter();
							}}
						/>
					</div>
					<div class="flex items-start justify-center flex-col gap-1">
						<Label>Color</Label>
						<div class="flex gap-1 items-center">
							<button
								style="background-color: {filter.color};"
								class="w-8 h-8 rounded-full mr-2"
								on:click={() => {
									if (!last_closed || last_closed.node !== filter.node) selected_filter = filter;
								}}
							/>
							<p>{filter.color}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
