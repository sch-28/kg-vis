<script lang="ts">
	import type { Property, Node, Graph, URI } from '../api/graph';
	import { Icon } from '@steeze-ui/svelte-icon';
	import {
		MagnifyingGlass,
		Link,
		ArrowRightOnRectangle,
		ArrowLeftOnRectangle,
		XMark,
		Plus,
		ListBullet,
		ArrowLeft
	} from '@steeze-ui/heroicons';
	import Fuse from 'fuse.js';
	import { click_outside } from '../util';
	import LoadingCircle from './Loading-Circle.svelte';
	import { Settings } from '../settings';
	import { SPARQL } from '../api/sparql';
	import { Button } from 'flowbite-svelte';

	export let selected_node: Node | undefined = undefined;
	export let menu_position = { x: 0, y: 0 };
	export let graph: Graph;
	export let information_tab_visible: boolean = false;
	export let loading: boolean = false;

	let progress = 0;
	type SortDirection = 1 | -1;
	type SortOptions = 'name' | 'count' | 'direction';
	const sort_options: SortOptions[] = ['direction', 'name', 'count'];
	let sort_direction: SortDirection = -1;
	let sort_by: SortOptions = 'name';
	let sorted_properties: {
		property: Property;
		matches?: readonly Fuse.FuseResultMatch[];
	}[] = [];

	let search_string: string = '';
	let search_input: HTMLInputElement;
	let show_search: boolean = false;

	let selected_property: Property | undefined = undefined;
	let selected_property_nodes: Node[] = [];
	let selected_nodes: Node[] = [];
	let sorted_nodes: {
		node: Node;
		matches?: readonly Fuse.FuseResultMatch[];
	}[] = [];

	let wrapper: HTMLElement;

	const menu_offset = 30;
	const menu_gap = 16;

	if (SPARQL.listenerCount('progress') === 0) {
		SPARQL.on('progress', (p) => {
			progress = p;
		});
	}

	$: {
		if (wrapper) {
			const new_position = { x: menu_position.x, y: menu_position.y };
			let window_width = window.innerWidth;
			if (information_tab_visible) {
				window_width -= 400;
			}
			if (new_position.x + wrapper.offsetWidth + menu_offset > window_width) {
				new_position.x = window_width - wrapper.offsetWidth - menu_gap;
			} else {
				new_position.x += menu_offset;
			}
			if (new_position.y + wrapper.offsetHeight / 2 > window.innerHeight) {
				new_position.y = window.innerHeight - wrapper.offsetHeight - menu_gap;
			} else if (new_position.y - wrapper.offsetHeight / 2 < 0) {
				new_position.y = menu_gap;
			} else {
				new_position.y -= wrapper.offsetHeight / 2;
			}

			wrapper.style.top = new_position.y + 'px';
			wrapper.style.left = new_position.x + 'px';
			progress = 0;
		}
	}

	$: {
		selected_node;
		reset();
	}

	$: {
		selected_property;
		property_reset();
	}

	function reset() {
		selected_property = undefined;
		selected_property_nodes = [];
		selected_nodes = [];
		sorted_nodes = [];
	}

	function property_reset() {
		selected_nodes = [];
	}

	function sort(sort_option: SortOptions) {
		if (sort_option == sort_by) {
			if (sort_direction === 1) {
				sort_direction = -1;
			} else if (sort_direction === -1) {
				sort_direction = 1;
			}
		} else {
			sort_by = sort_option;
		}
	}

	$: {
		sort_by;
		sort_direction;
		search_string;
		if (selected_node && selected_node.properties.length > 0 && !selected_property) {
			let properties = [...selected_node.properties].map(
				(
					property
				): {
					property: Property;
					matches?: readonly Fuse.FuseResultMatch[];
				} => {
					return { property, matches: [] };
				}
			);
			if (search_string.length > 0) {
				const fuse = new Fuse(selected_node.properties, {
					keys: ['label'],
					includeMatches: true,
					threshold: 0.3,
					shouldSort: true,
					distance: 1000
				});
				properties = fuse.search(search_string).map((result) => {
					return { property: result.item, matches: result.matches };
				});
			}
			sorted_properties = properties.sort((a, b) => {
				if (sort_by == 'count') {
					return (
						sort_direction *
						(a.property.in_count + a.property.out_count <=
						b.property.in_count + b.property.out_count
							? 1
							: -1)
					);
				} else if (sort_by == 'name') {
					if (!a.property.label || !b.property.label) return 1;
					return (
						sort_direction *
						(a.property.label.toLocaleLowerCase() <= b.property.label.toLocaleLowerCase() ? 1 : -1)
					);
				} else {
					return sort_direction * (a.property.in_count < b.property.in_count ? 1 : -1);
				}
			});
		}
	}

	$: {
		sort_by;
		sort_direction;
		search_string;
		selected_property;
		selected_property_nodes;
		if (
			selected_node &&
			selected_node.properties.length > 0 &&
			selected_property &&
			selected_property_nodes.length > 0
		) {
			let nodes = [...selected_property_nodes]
				.map(
					(
						node
					): {
						node: Node;
						matches?: readonly Fuse.FuseResultMatch[];
					} => {
						return { node: node, matches: [] };
					}
				)
				.sort((a, b) => {
					return a.node.label.toLocaleLowerCase() <= b.node.label.toLocaleLowerCase() ? -1 : 1;
				});
			if (search_string.length > 0) {
				const fuse = new Fuse(selected_property_nodes, {
					keys: ['label'],
					includeMatches: true,
					threshold: 0.3,
					shouldSort: true,
					distance: 1000
				});
				nodes = fuse.search(search_string).map((result) => {
					return { node: result.item, matches: result.matches };
				});
			}
			sorted_nodes = nodes;
		}
	}

	async function property_clicked(uri: URI, property: Property) {
		selected_property = property;
		selected_property_nodes = [];
		search_string = '';
		show_search = false;
		selected_property_nodes = await graph.load_related_nodes(
			uri,
			property,
			false,
			graph.network?.DOMtoCanvas(menu_position)
		);
	}

	function add_node(node: Node) {
		graph.show_node(node);
		selected_property_nodes = selected_property_nodes;
	}

	function search(event: KeyboardEvent) {
		if (
			event.key !== 'Escape' &&
			event.key.length == 1 &&
			(!show_search || document.activeElement !== search_input)
		) {
			search_string += event.key;
			show_search = true;
			setTimeout(() => {
				search_input?.focus();
			}, 0);
		} else if (show_search && event.key === 'Escape') {
			show_search = false;
			search_string = '';
		}
	}

	function toggle_all_nodes(event: Event) {
		const target: HTMLInputElement = event.target as HTMLInputElement;
		selected_nodes = target.checked ? selected_property_nodes.filter((n) => !n.visible) : [];
	}

	function add_selected() {
		graph.show_nodes(selected_nodes);
		selected_node = undefined;
	}

	async function add_all() {
		selected_property = {
			label: 'All',
			in_count: 0,
			out_count: 0,
			uri: '',
			fetched: true,
			related: []
		};
		selected_property_nodes = [];
		const promises = sorted_properties.map((p) => {
			return new Promise<Node[]>((res) => {
				if (!selected_node) return res([]);
				graph
					.load_related_nodes(selected_node.id, p.property, false, undefined, false, false)
					.then((nodes) => {
						for (let node of nodes) {
							if (!selected_property_nodes.find((n) => n.id === node.id)) {
								selected_property_nodes.push(node);
							}
						}
						selected_property_nodes = selected_property_nodes;
						return res(nodes);
					});
			});
		});

		const new_nodes = [...new Set((await Promise.all(promises)).flat())];
		graph.load_relations(new_nodes, false, true);
	}
</script>

{#if selected_node}
	<div
		class="wrapper border dark:border-dark-muted dark:bg-dark-bg bg-white shadow-md z-40 rounded-2xl flex flex-col"
		on:mouseover={() => document.addEventListener('keydown', search)}
		on:focus={() => document.addEventListener('keydown', search)}
		on:mouseout={() => document.removeEventListener('keydown', search, false)}
		on:blur={() => document.removeEventListener('keydown', search, false)}
		bind:this={wrapper}
	>
		<div class="text-lg font-bold mx-2 flex items-center gap-5 justify-between">
			<h1
				class="truncate"
				title={selected_node.label + (selected_property ? ' / ' + selected_property.label : '')}
			>
				<button
					on:click={() => (selected_property = undefined)}
					class="inline-flex items-baseline gap-1"
				>
					{#if selected_property}
						<Icon src={ArrowLeft} class="h-4 w-4 self-center" />
					{/if}
					{selected_node.label}</button
				>
				{#if selected_property}
					<span class="text-sm font-normal">/ {selected_property.label}</span>
				{/if}
			</h1>
			<div class="flex items-center gap-3">
				<button
					class="w-6 h-10 relative transition-all {show_search ? 'w-36' : 'cursor-pointer'}"
					on:click={() => {
						show_search = true;
						setTimeout(() => search_input.focus(), 0);
					}}
					use:click_outside
					on:click_outside={() => (search_string.length == 0 ? (show_search = false) : null)}
				>
					<button on:click={() => (search_string = '')} class="contents">
						<Icon
							src={XMark}
							theme="solid"
							class="h-5 w-5  absolute z-10 bottom-1/2 translate-y-1/2 cursor-pointer right-2 {show_search &&
							search_string.length > 0
								? 'visible'
								: 'hidden'}"
						/>
					</button>
					<input
						bind:this={search_input}
						bind:value={search_string}
						type="text"
						class="{show_search ? 'dark:bg-slate-800  pl-8 visible pr-7 shadow-inset' : 'hidden'}
							w-full  rounded-lg 
							placeholder:text-gray-400
							text-sm
							py-2
							outline-none
							font-normal border-none focus:ring-primary
							"
					/>

					<Icon
						src={MagnifyingGlass}
						theme="solid"
						class="h-5 w-5 absolute z-10 bottom-1/2 translate-y-1/2 pointer-events-none cursor-pointer {show_search &&
							'left-2'}"
					/>
				</button>
				<a href={selected_node.id} target="_blank" rel="noreferrer">
					<Icon src={Link} theme="solid" class="h-5 w-5 cursor-pointer" />
				</a>
			</div>
		</div>
		<div class="mx-2 my-2">
			<div class="w-full bg-slate-400 rounded-full h-1.5  dark:bg-slate-.500 ">
				<div
					class="bg-dark-muted h-1.5 rounded-full"
					style="width: {selected_node.properties.length == 0 ? progress.toString() : 100}%"
				/>
			</div>
		</div>
		{#if selected_node.properties.length > 0 && selected_property === undefined}
			<button
				on:click={add_all}
				class="mx-2 px-2 button flex  rounded-lg  h-10 bg-transparent hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out {selected_node.properties.every(
					(p) => p.fetched && p.related.every((r) => r.visible)
				)
					? 'opacity-50 cursor-default'
					: 'opacity-100 cursor-pointer'}"
			>
				<Icon src={ListBullet} theme="solid" class="h-5 w-5  mr-3" />
				<span class="truncate" title={'Add all related properties (max 100 of each property)'}>
					Add all
				</span>
				<span
					class="ml-auto w-6 bg-dark-muted text-light rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
					>{sorted_properties.reduce(
						(sum, p) => sum + p.property.in_count + p.property.out_count,
						0
					)}</span
				>
			</button>
			<div class="flex mb-1">
				{#each sort_options as sort_option}
					<button
						class={`select-none gap-2 flex flex-none items-center justify-center p-2 cursor-pointer  leading-snug transform transition-all ${
							sort_by !== sort_option ? 'text-dark-muted dark:text-light-muted' : 'text-primary'
						} 
						${sort_option == 'count' ? 'ml-auto' : ''}
						`}
						on:click={() => sort(sort_option)}
					>
						<span class="capitalize ">{sort_option != 'direction' ? sort_option : ''}</span>
						<svg
							width="1em"
							height="1em"
							class="fill-current text-[10px] {sort_by === sort_option && sort_direction === 1
								? '-scale-y-[1]'
								: ''}"
							viewBox="0 0 9 7"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M4.49999 0L8.3971 6.75H0.602875L4.49999 0Z" />
						</svg>
					</button>
				{/each}
			</div>
			<div class="properties">
				{#each sorted_properties as property}
					<button
						on:click={() => selected_node && property_clicked(selected_node.id, property.property)}
						class="button flex px-2 rounded-lg bg-transparent h-10 hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out {property
							.property.related.length > 0 &&
						property.property.fetched &&
						property.property.related.every((r) => r.visible)
							? 'opacity-50 cursor-default'
							: 'opacity-100 cursor-pointer'}"
					>
						<div
							title={`${
								property.property.in_count < property.property.out_count ? `Target of` : `Source of`
							} "${property.property.label}"`}
						>
							<Icon
								src={property.property.in_count < property.property.out_count
									? ArrowRightOnRectangle
									: ArrowLeftOnRectangle}
								theme="solid"
								class="h-5 w-5  mr-3"
							/>
						</div>
						{#if property.property.label}
							<span class="truncate" title={property.property.label}>
								{#if property.matches && property.matches.length > 0}
									{property.property.label.slice(
										0,
										property.matches[0].indices[0][0]
									)}{#each property.matches[0].indices as indice, index}
										<span class="text-primary"
											>{property.property.label.slice(indice[0], indice[1] + 1)}</span
										>{property.property.label.slice(
											indice[1] + 1,
											property.matches[0].indices[index + 1]?.[0] ?? property.property.label.length
										)}
									{/each}
								{:else}
									{property.property.label}
								{/if}
							</span>
						{:else}
							<span class="truncate" title={property.property.uri}>
								{property.property.uri}
							</span>
						{/if}
						<span
							class="ml-auto w-6 bg-dark-muted text-light rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
							>{property.property.in_count + property.property.out_count > $Settings.size_limit * 2
								? $Settings.size_limit
								: property.property.in_count + property.property.out_count}</span
						>
					</button>
				{/each}
				{#if loading}
					<div class="w-8 h-8 mx-auto mt-2">
						<LoadingCircle />
					</div>
				{/if}
			</div>
		{:else if selected_property_nodes.length > 0}
			<div class="flex justify-between items-center mb-1 mx-2">
				<div class="flex h-10">
					<div class="flex items-center cursor-pointer">
						<input
							id="select_all"
							type="checkbox"
							value=""
							on:change={toggle_all_nodes}
							checked={selected_nodes.length === selected_property_nodes.length}
							class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
						/>
						<label
							for="select_all"
							class="cursor-pointer ml-2 font-medium text-gray-900 dark:text-gray-300 select-none"
							>Select All</label
						>
					</div>
				</div>
				<div>
					{selected_nodes.length} / {sorted_nodes.length -
						sorted_nodes.filter((n) => n.node.visible).length}
				</div>
			</div>
			<ul class=" rounded-lg mx-2  overflow-y-auto  flex flex-col gap-2 flex-grow">
				{#each sorted_nodes as node}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<li
						class="px-3 rounded-lg bg-transparent flex transition-all duration-200 ease-in-out {node
							.node.visible
							? 'text-dark-muted'
							: 'text-gray-900 dark:text-gray-300'}"
						on:click={() => {
							if (node.node.visible) return;
							if (selected_nodes.find((n) => n.id === node.node.id)) {
								selected_nodes = selected_nodes.filter((n) => n.id !== node.node.id);
							} else selected_nodes = selected_nodes.concat([node.node]);
						}}
					>
						<div class="flex items-center cursor-pointer min-w-0 flex-grow select-none">
							{#if !node.node.visible}
								<input
									on:click={(e) => {
										e.stopPropagation();
									}}
									id={node.node.id}
									type="checkbox"
									value={node.node}
									bind:group={selected_nodes}
									class="w-4 h-4 bg-gray-100 rounded border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								/>
							{:else}
								<input
									on:click={(e) => {
										e.stopPropagation();
									}}
									id={node.node.id}
									type="checkbox"
									checked={true}
									disabled={true}
									class="w-4 h-4 text-dark-muted bg-gray-100 rounded border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								/>
							{/if}
							<label
								on:click={(e) => {
									e.stopPropagation();
								}}
								for={node.node.id}
								class="cursor-pointer ml-2 font-medium  select-none truncate"
								>{#if node.node.label}
									<span class="" title={node.node.label}>
										{#if node.matches && node.matches.length > 0}
											{node.node.label.slice(
												0,
												node.matches[0].indices[0][0]
											)}{#each node.matches[0].indices as indice, index}
												<span class="text-primary"
													>{node.node.label.slice(indice[0], indice[1] + 1)}</span
												>{node.node.label.slice(
													indice[1] + 1,
													node.matches[0].indices[index + 1]?.[0] ?? node.node.label.length
												)}
											{/each}
										{:else}
											{node.node.label}
										{/if}
									</span>
								{:else}
									<span class="truncate" title={node.node.id}>
										{node.node.id}
									</span>
								{/if}
							</label>
						</div>
						<button
							class="ml-auto p-1 rounded-lg bg-transparent {!node.node.visible
								? 'hover:bg-black/5 dark:hover:bg-black/30'
								: ''} transition-all duration-200 ease-in-out"
							on:click={() => add_node(node.node)}
						>
							<Icon src={Plus} size={'20'} />
						</button>
					</li>
				{/each}
			</ul>
			<Button on:click={add_selected} disabled={selected_nodes.length == 0} class=""
				>Add selected</Button
			>
		{:else}
			<div class="properties m-auto w-full items-center justify-center p-5">
				<div role="status">
					<LoadingCircle />
					<span class="sr-only">Loading...</span>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.wrapper {
		position: absolute;
		padding: 8px;
		max-width: 380px;
		width: 380px;
		height: 326px;
	}

	.properties {
		overflow-y: scroll;
		max-height: 200px;
		height: 200px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-left: 8px;
		margin-right: 4px;
	}

	.button,
	li {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		min-height: 35px;
		max-height: 35px;
		align-items: center;
	}

	::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}

	::-webkit-scrollbar-thumb {
		background-color: hsl(0 0% 98%);
		border-radius: 1rem;
	}

	::-webkit-scrollbar-track {
		background-color: transparent;
	}
	::-webkit-scrollbar-track {
		background-color: transparent;
	}
</style>
