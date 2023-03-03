<script lang="ts">
	import { type Property, type Node, type Graph, type URI, CurrentGraph } from '../api/graph';
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
	import { click_outside, fuzzy_search } from '../util';
	import LoadingCircle from './util/Loading-Circle.svelte';
	import { Settings } from '../settings';
	import { Button, Checkbox } from 'flowbite-svelte';
	import type Fuse from 'fuse.js';
	import { onDestroy } from 'svelte';
	import { LoaderManager } from './loader/graph-loader';
	import Moveable from 'svelte-moveable';
	import { bottom, right } from '@popperjs/core';
	import { Height } from '@steeze-ui/material-design-icons';

	export let selected_node: Node | undefined = undefined;
	export let menu_position = { x: 0, y: 0 };
	export let information_tab_visible: boolean = false;
	export let loading: boolean = false;

	type PropertyState = {
		sorted_items: {
			item: Property;
			button?: HTMLElement;
			matches?: readonly Fuse.FuseResultMatch[];
		}[];
		items: Property[];
		current_context: 'property';
		sort_by: 'name' | 'count' | 'direction';
		sort_options: ['direction', 'name', 'count'];
	};

	type NodeState = {
		sorted_items: { item: Node; button?: HTMLElement; matches?: readonly Fuse.FuseResultMatch[] }[];
		items: Node[];
		current_context: 'node';
		selected_nodes: Node[];
		selected_property: Property;
		sort_by: 'name' | 'direction';
		sort_options: ['direction', 'name'];
	};

	type State = {
		sort_direction: 1 | -1;
	} & (PropertyState | NodeState);

	let state: State = {
		sort_direction: 1,
		items: [],
		sorted_items: [],
		current_context: 'property',
		sort_by: 'name',
		sort_options: ['direction', 'name', 'count']
	};

	let search_string: string = '';
	let show_search: boolean = false;
	let selected_item: number = -2;

	let wrapper: HTMLElement;
	let search_input: HTMLInputElement;
	let add_all_button: HTMLButtonElement;
	const menu_offset = 30;
	const menu_gap = 16;
	let item_container: HTMLElement;

	let frame = {
		translate: [0, 0]
	};
	let moveable: Moveable;

	$: wrapper && menu_position && set_menu_position();

	function set_menu_position() {
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
	}

	$: selected_node && reset();

	$: !selected_node && document.removeEventListener('keydown', search, false);

	function reset() {
		state = {
			sort_direction: 1,
			items: selected_node?.properties ?? [],
			sorted_items: [],
			current_context: 'property',
			sort_by: 'name',
			sort_options: ['direction', 'name', 'count']
		};
		set_selected_item(-2);
		sort_items();
		item_container?.scrollTo(0, 0);
		if (search_string.length > 0) {
			show_search = true;
		}
		moveable?.updateRect();
	}

	function change_sort_by(new_sort_by: typeof state.sort_by) {
		if (state.sort_by === new_sort_by) {
			state.sort_direction *= -1;
		} else {
			state.sort_by = new_sort_by;
			state.sort_direction = -1;
		}

		sort_items();
		item_container?.scrollTo(0, 0);
	}

	$: {
		search_string;
		sort_items();
	}

	$: show_search && set_selected_item(-2);

	function set_selected_item(index: number) {
		selected_item = index;
	}

	function sort_items() {
		if (search_string.length > 0) {
			state.sorted_items = fuzzy_search<Property | Node>(state.items, search_string, [
				'label',
				'id'
			]).map((item) => {
				return { item: item.item, matches: item.matches, button: undefined };
			}) as unknown as any;
		} else {
			state.sorted_items = state.items.map((item) => {
				return { item: item, button: undefined };
			}) as unknown as any;
		}

		state.sorted_items.sort((a, b) => {
			if (state.sort_by == 'count' && state.current_context === 'property') {
				a.item = a.item as Property;
				b.item = b.item as Property;
				return state.sort_direction * (a.item.count <= b.item.count ? 1 : -1);
			} else if (state.sort_by == 'direction' && state.current_context === 'property') {
				a.item = a.item as Property;
				b.item = b.item as Property;
				return state.sort_direction * (a.item.direction === 'out' ? 1 : -1);
			} else if (state.sort_by === 'direction' && state.current_context === 'node') {
				a.item = a.item as Node;
				b.item = b.item as Node;
				return state.sort_direction * (state.selected_nodes.includes(a.item) ? 1 : -1);
			} else {
				if (!a.item.label || !b.item.label) return 1;
				return (
					state.sort_direction *
					(a.item.label.toLocaleLowerCase() <= b.item.label.toLocaleLowerCase() ? 1 : -1)
				);
			}
		});
	}

	async function item_clicked(item: Property | Node) {
		if (!selected_node) return;

		if (state.current_context === 'property') {
			state = {
				sort_direction: state.sort_direction,
				items: [],
				sorted_items: [],
				current_context: 'node',
				selected_nodes: [],
				selected_property: item as Property,
				sort_by: 'name',
				sort_options: ['direction', 'name']
			};
			set_selected_item(-2);
			search_string = '';
			show_search = false;
			loading = true;
			state.items = await $CurrentGraph.load_related_nodes(
				selected_node.id,
				item as Property,
				false,
				$CurrentGraph.network?.DOMtoCanvas(menu_position)
			);
			loading = false;
			item_container?.scrollTo(0, 0);
			sort_items();
		} else {
			item = item as Node;
			if (is_disabled(item)) return;
			if (state.selected_nodes.includes(item)) {
				state.selected_nodes = state.selected_nodes.filter((node) => node !== item);
			} else {
				state.selected_nodes.push(item);
			}
			state = state;
		}
	}

	function search(event: KeyboardEvent) {
		if (event.code === 'KeyF' && event.ctrlKey) {
			event.preventDefault();
			event.stopPropagation();
			show_search = !show_search;

			if (show_search)
				setTimeout(() => {
					if (show_search) search_input?.focus();
				}, 0);
		} else if (
			event.key !== 'Escape' &&
			event.key !== 'Enter' &&
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
		} else if (event.code === 'ArrowDown') {
			event.preventDefault();
			select_item(1);
		} else if (event.code === 'ArrowUp') {
			event.preventDefault();
			select_item(-1);
		}
	}

	function select_item(dir: -1 | 1) {
		if (state.sorted_items.length > 0) {
			if (selected_item + dir >= -2 && selected_item + dir < state.sorted_items.length) {
				selected_item += dir;
			} else if (selected_item + dir < -2) {
				selected_item = state.sorted_items.length - 1;
			} else if (selected_item + dir >= state.sorted_items.length) {
				selected_item = -2;
			}

			if (selected_item === -2) {
				show_search = true;
				setTimeout(() => {
					if (show_search) search_input?.focus();
				}, 0);
			} else {
				show_search = false;
			}

			if (selected_item === -1) {
				add_all_button?.focus();
				add_all_button?.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest'
				});
			} else if (state.sorted_items[selected_item]?.button) {
				state.sorted_items[selected_item].button?.focus();
				state.sorted_items[selected_item].button?.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest'
				});
			}
		}
	}

	function add_selected() {
		if (state.current_context === 'property') return;
		$CurrentGraph.show_nodes(state.selected_nodes);
		close();
	}

	async function show_all() {
		if (state.current_context === 'node') return;

		const properties = state.sorted_items.map((p) => p.item);

		state = {
			sort_direction: state.sort_direction,
			items: [],
			sorted_items: [],
			current_context: 'node',
			selected_nodes: [],
			selected_property: {
				label: 'All',
				count: 0,
				uri: '',
				fetched: true,
				related: [],
				direction: 'out'
			},
			sort_by: 'name',
			sort_options: ['direction', 'name']
		};

		const promises = properties.map((p) => {
			return new Promise<Node[]>((res) => {
				if (!selected_node) return res([]);
				$CurrentGraph
					.load_related_nodes(selected_node.id, p, false, undefined, false)
					.then((nodes) => {
						if (state.current_context === 'node') {
							for (let node of nodes) {
								if (!state.items.find((n) => n.id === node.id)) {
									state.items.push(node);
								}
							}
						}
						sort_items();
						return res(nodes);
					});
			});
		});

		const new_nodes = [...new Set((await Promise.all(promises)).flat())];
		$CurrentGraph.load_relations(new_nodes, false);
	}

	async function add_all() {
		if (state.current_context === 'node') return;
		const node = selected_node;
		if (!node) return;

		close();

		const properties = state.sorted_items.map((p) => p.item);
		const promises = properties.map((p) =>
			$CurrentGraph.load_related_nodes(node.id, p, false, undefined, false)
		);
		const promise = Promise.all(promises);
		const new_nodes = [...new Set((await promise).flat())];
		$CurrentGraph.show_nodes(new_nodes, false);
		await $CurrentGraph.load_relations(new_nodes, true);
	}

	async function add_property(property: Property | Node) {
		if (!selected_node || state.current_context === 'node') return;
		property = property as Property;
		const selected_node_id = selected_node.id;

		$CurrentGraph.load_related_nodes(
			selected_node_id,
			property,
			true,
			$CurrentGraph.network?.DOMtoCanvas(menu_position)
		);
		close();
	}

	function is_disabled(item: Node | Property) {
		if (state.current_context === 'node') {
			item = item as Node;
			return item.visible;
		} else {
			item = item as Property;
			return item.related.length > 0 && item.fetched && item.related.every((r) => r.visible);
		}
	}

	function select_all() {
		if (state.current_context === 'node') {
			const not_visible_nodes = state.sorted_items
				.filter((n) => !n.item.visible)
				.map((n) => n.item);

			if (not_visible_nodes.length === state.selected_nodes.length) {
				state.selected_nodes = [];
			} else {
				state.selected_nodes = not_visible_nodes;
			}
			state = state;
		}
	}

	function add_node(node: Node | Property) {
		if (state.current_context === 'node') {
			node = node as Node;
			if (!node.visible) {
				$CurrentGraph.show_node(node);
				state = state;
			}
		}
	}

	function close() {
		LoaderManager.open();
		selected_node = undefined;
	}

	onDestroy(() => {
		document.removeEventListener('keydown', search, false);
	});
</script>

{#if selected_node}
	<div
		id="property-menu"
		class="target absolute w-[380px] p-2 h-[326px] border dark:border-dark-muted dark:bg-dark-bg bg-white shadow-md z-40 rounded-2xl flex flex-col"
		on:mouseover={() => {
			document.addEventListener('keydown', search);
			wrapper.setAttribute('focus', 'active');
		}}
		on:focus={() => {
			document.addEventListener('keydown', search);
			wrapper.setAttribute('focus', 'active');
		}}
		on:mouseout={() => {
			document.removeEventListener('keydown', search, false);
			wrapper.removeAttribute('focus');
		}}
		on:blur={() => {
			document.removeEventListener('keydown', search, false);
			wrapper.removeAttribute('focus');
		}}
		bind:this={wrapper}
	>
		<div class="text-lg font-bold mx-2 flex items-center gap-5 justify-between">
			<h1
				class="truncate"
				title={selected_node.label +
					(state.current_context == 'node' ? ' / ' + state.selected_property.label : '')}
			>
				<button on:click={reset} class="inline-flex items-baseline gap-1">
					{#if state.current_context == 'node'}
						<Icon src={ArrowLeft} class="h-4 w-4 self-center" />
					{/if}
					{selected_node.label}</button
				>
				{#if state.current_context == 'node'}
					<span class="text-sm font-normal">/ {state.selected_property.label}</span>
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
				<div class="bg-dark-muted h-1.5 rounded-full h-full" />
			</div>
		</div>
		{#if state.current_context == 'property'}
			<button
				bind:this={add_all_button}
				on:click={show_all}
				class="min-h-[34px] mx-2 px-2 flex items-center rounded-lg  h-10 bg-transparent focus:bg-black/5 dark:focus:bg-black/30 !outline-none hover:bg-black/5 dark:hover:bg-black/30  {selected_node.properties.every(
					(p) => p.fetched && p.related.every((r) => r.visible)
				)
					? 'opacity-50 cursor-default'
					: 'opacity-100 cursor-pointer'}"
			>
				<Icon src={ListBullet} theme="solid" class="h-5 w-5  mr-3" />
				<span class="truncate" title={'Add all related properties (max 100 of each property)'}>
					Add all
				</span>
				<button
					on:click={add_all}
					class="transition-all duration-200 ease-in-out hover:bg-black/5 dark:hover:bg-black/30 hover:text-dark hover:dark:text-light ml-auto w-6 bg-dark-muted text-light rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
					>{state.sorted_items.reduce((sum, p) => sum + p.item.count, 0)}</button
				>
			</button>
		{:else}
			<button
				bind:this={add_all_button}
				on:click={select_all}
				class="focus:bg-black/5 dark:focus:bg-black/30 !outline-none min-h-[34px] mx-2 px-2 flex items-center rounded-lg  h-10 bg-transparent hover:bg-black/5 dark:hover:bg-black/30  {state.sorted_items.filter(
					(i) => !i.item.visible
				).length == 0
					? 'opacity-50 cursor-default'
					: 'opacity-100 cursor-pointer'}"
			>
				<Checkbox
					checked={state.selected_nodes.length > 0 &&
						state.sorted_items.filter((i) => !i.item.visible).length == state.selected_nodes.length}
					on:click={(e) => {
						select_all();
						e.stopPropagation();
					}}
					disabled={state.sorted_items.filter((i) => !i.item.visible).length == 0}
					class="focus:outline-none focus:ring-0 mr-4 cursor-[inherit]"
				/>
				<span class="truncate" title={'Add all related properties (max 100 of each property)'}>
					Select All
				</span>
				<span
					class="ml-auto bg-dark-muted text-light rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
					>{state.selected_nodes.length} / {state.sorted_items.length -
						state.sorted_items.filter((n) => n.item.visible).length}</span
				>
			</button>
		{/if}
		<div class="flex mb-1">
			{#each state.sort_options as sort_option}
				<button
					class={`select-none gap-2 flex flex-none items-center justify-center p-2 cursor-pointer  leading-snug   ${
						state.sort_by !== sort_option ? 'text-dark-muted dark:text-light-muted' : 'text-primary'
					} 
		${sort_option == 'count' ? 'ml-auto' : ''}
		`}
					on:click={() => change_sort_by(sort_option)}
				>
					<span class="capitalize">{sort_option != 'direction' ? sort_option : ''}</span>
					<svg
						width="1em"
						height="1em"
						class="fill-current text-[10px] {state.sort_by === sort_option &&
						state.sort_direction === 1
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
		<div class="flex flex-col overflow-y-auto h-full ml-2 mr-1 " bind:this={item_container}>
			{#each state.sorted_items as item, i}
				<button
					bind:this={item.button}
					on:click={(e) => {
						item_clicked(item.item);
						e.stopPropagation();
					}}
					class="focus:bg-black/5 dark:focus:bg-black/30 !outline-none truncate min-w-0 min-h-[35px] items-center flex px-2 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-black/30  {is_disabled(
						item.item
					)
						? 'opacity-50 cursor-default'
						: 'opacity-100 cursor-pointer'}"
				>
					{#if state.current_context == 'property'}
						<div
							title={`${
								state.sorted_items[i].item.direction == 'out'
									? `${selected_node.label} ${item.item.label} [others]`
									: `[others] ${item.item.label} ${selected_node.label}`
							}`}
						>
							<Icon
								src={state.sorted_items[i].item.direction == 'out'
									? ArrowRightOnRectangle
									: ArrowLeftOnRectangle}
								theme="solid"
								class="h-5 w-5  mr-3"
							/>
						</div>
					{:else}
						<Checkbox
							checked={state.selected_nodes.includes(state.sorted_items[i].item)}
							on:click={(e) => {
								item_clicked(item.item);
								e.stopPropagation();
							}}
							disabled={is_disabled(item.item)}
							class="focus:outline-none focus:ring-0 mr-2 cursor-[inherit]"
						/>
					{/if}
					{#if item.item.label}
						<span class="truncate" title={item.item.label}>
							{#if item.matches && item.matches.length > 0}
								{item.item.label.slice(
									0,
									item.matches[0].indices[0][0]
								)}{#each item.matches[0].indices as indice, index}
									<span class="text-primary">{item.item.label.slice(indice[0], indice[1] + 1)}</span
									>{item.item.label.slice(
										indice[1] + 1,
										item.matches[0].indices[index + 1]?.[0] ?? item.item.label.length
									)}
								{/each}
							{:else}
								{item.item.label}
							{/if}
						</span>
					{:else if state.current_context == 'property'}
						<span class="truncate" title={state.sorted_items[i].item.uri}>
							{state.sorted_items[i].item.uri}
						</span>
					{:else}
						<span class="truncate" title={state.sorted_items[i].item.id}>
							{state.sorted_items[i].item.id}
						</span>
					{/if}

					{#if state.current_context == 'property'}
						<button
							on:click={(e) => {
								e.stopPropagation();
								add_property(state.sorted_items[i].item);
							}}
							class="hover:bg-black/5 dark:hover:bg-black/30 ml-auto w-6 hover:text-dark hover:dark:text-light bg-dark-muted text-light rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 transition-all duration-200 ease-in-out"
							>{state.sorted_items[i].item.count > $Settings.size_limit * 2
								? $Settings.size_limit
								: state.sorted_items[i].item.count}</button
						>
					{:else if state.current_context == 'node'}
						<button
							class="ml-auto p-1 rounded-lg bg-transparent {!state.sorted_items[i].item.visible
								? 'hover:bg-black/5 dark:hover:bg-black/30'
								: 'cursor-default'} transition-all duration-200 ease-in-out"
							on:click={() => add_node(state.sorted_items[i].item)}
						>
							<Icon src={Plus} size={'20'} />
						</button>
					{/if}
				</button>
			{/each}
			{#if loading}
				<div class="w-8 h-8 mx-auto mt-2">
					<LoadingCircle />
				</div>
			{/if}
		</div>
		{#if state.current_context === 'node'}
			<Button on:click={add_selected} disabled={state.selected_nodes.length == 0} class=""
				>Add selected</Button
			>
		{/if}
	</div>
	<Moveable
		bind:this={moveable}
		target={wrapper}
		resizable={true}
		keepRatio={false}
		throttleResize={1}
		edge={true}
		zoom={1}
		origin={false}
		padding={{ left: -5, top: -5, right: -5, bottom: -5 }}
		on:resizeStart={({ detail: e }) => {
			e.setOrigin(['%', '%']);
			e.dragStart && e.dragStart.set(frame.translate);
		}}
		on:resize={({ detail: e }) => {
			const beforeTranslate = e.drag.beforeTranslate;

			if (e.width < 210) e.width = 210;
			if (e.height < 200) e.height = 200;

			frame.translate = beforeTranslate;
			e.target.style.width = `${e.width}px`;
			e.target.style.height = `${e.height}px`;
			e.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
		}}
	/>
{/if}

<style>
	#property-menu:after {
		content: '';
		position: absolute;
		bottom: 6px;
		right: 5px;
		border-top: 1px solid;
		height:4px;
		width: 6px;
		transform: rotate(-45deg);
	}
	#property-menu:before {
		content: '';
		position: absolute;
		bottom: 6px;
		right: 3px;
		border-bottom: 1px solid;
		height:4px;
		width: 10px;
		transform: rotate(-45deg);
	}
</style>
