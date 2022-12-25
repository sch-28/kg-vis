<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Property, Node, Graph, URI } from "../api/graph";
	import { Icon } from "@steeze-ui/svelte-icon";
	import {
		MagnifyingGlass,
		Link,
		ArrowRightOnRectangle,
		ArrowLeftOnRectangle,
		XMark
	} from "@steeze-ui/heroicons";
	import Fuse from "fuse.js";
	import { click_outside, dark_mode } from "../util";
	import toast from "svelte-french-toast";

	const dispatch = createEventDispatcher();

	export let selected_node: Node | undefined = undefined;
	export let menu_position = { x: 0, y: 0 };
	export let progress = 0;
	export let graph: Graph;

	type SortDirection = 1 | -1;
	type SortOptions = "name" | "count" | "direction";
	const sort_options: SortOptions[] = ["direction", "name", "count"];
	let sort_direction: SortDirection = -1;
	let sort_by: SortOptions = "name";
	let sorted_properties: {
		property: Property;
		matches?: readonly Fuse.FuseResultMatch[];
	}[] = [];

	let search_string: string = "";
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

	$: {
		if (wrapper) {
			wrapper.style.top = menu_position.y + "px";
			wrapper.style.left = menu_position.x + "px";
		}
	}

	$: {
		selected_node;
		selected_property = undefined;
		selected_property_nodes = [];
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
		if (
			selected_node &&
			selected_node.properties.length > 0 &&
			!selected_property
		) {
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
					keys: ["label"],
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
				if (sort_by == "count") {
					return (
						sort_direction *
						(a.property.in_count + a.property.out_count <=
						b.property.in_count + b.property.out_count
							? 1
							: -1)
					);
				} else if (sort_by == "name") {
					if (!a.property.label || !b.property.label) return 1;
					return (
						sort_direction *
						(a.property.label.toLocaleLowerCase() <=
						b.property.label.toLocaleLowerCase()
							? 1
							: -1)
					);
				} else {
					return (
						sort_direction *
						(a.property.in_count < b.property.in_count ? 1 : -1)
					);
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
			let nodes = [...selected_property_nodes].map(
				(
					node
				): {
					node: Node;
					matches?: readonly Fuse.FuseResultMatch[];
				} => {
					return { node: node, matches: [] };
				}
			);
			if (search_string.length > 0) {
				const fuse = new Fuse(selected_property_nodes, {
					keys: ["label"],
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

	async function property_click_load_all(uri: URI, property: Property) {
		selected_node = undefined;
		const data_promise = graph.load_data(
			uri,
			property,
			true,
			graph.network?.DOMtoCanvas(menu_position)
		);
		toast.promise(
			data_promise,
			{
				loading: "Loading...",
				success: "Loaded!",
				error: "Error!"
			},
			{
				position: "bottom-center",
				style: `${
					dark_mode
						? "background: #1f2937; color: #fff"
						: "background: #fff; color: #000"
				}`
			}
		);
	}

	async function property_clicked(uri: URI, property: Property) {
		selected_property = property;
		selected_property_nodes = [];
		search_string = "";
		show_search = false;
		selected_property_nodes = await graph.load_data(
			uri,
			property,
			false,
			graph.network?.DOMtoCanvas(menu_position)
		);
	}

	function search(event: KeyboardEvent) {
		if (
			event.key !== "Escape" &&
			event.key.length == 1 &&
			(!show_search || document.activeElement !== search_input)
		) {
			search_string += event.key;
			show_search = true;
			setTimeout(() => {
				search_input?.focus();
			}, 0);
		} else if (show_search && event.key === "Escape") {
			show_search = false;
			search_string = "";
		}
	}

	function toggle_all_nodes(event: Event) {
		const target: HTMLInputElement = event.target as HTMLInputElement;
		selected_nodes = target.checked ? selected_property_nodes : [];
	}

	function add_selected() {
		graph.show_nodes(selected_nodes);
		selected_node = undefined;
	}
</script>

{#if selected_node}
	<div
		class="wrapper bg-slate-200 dark:bg-[#1f2937] shadow-md z-40 -translate-y-1/2 translate-x-12 rounded-2xl flex flex-col"
		on:mouseover={() => document.addEventListener("keydown", search)}
		on:focus={() => document.addEventListener("keydown", search)}
		on:mouseout={() => document.removeEventListener("keydown", search, false)}
		on:blur={() => document.removeEventListener("keydown", search, false)}
		bind:this={wrapper}
	>
		<div class="text-lg font-bold mx-2 flex items-center gap-5 justify-between">
			<h1 class="truncate" title={selected_node.label}>
				<button on:click={() => (selected_property = undefined)}
					>{selected_node.label}</button
				>
				{#if selected_property}
					<span class="text-sm font-normal">/ {selected_property.label}</span>
				{/if}
			</h1>
			<div class="flex items-center gap-3">
				<button
					class="w-6 h-10 relative transition-all {show_search
						? 'w-36'
						: 'cursor-pointer'}"
					on:click={() => {
						show_search = true;
						setTimeout(() => search_input.focus(), 0);
					}}
					use:click_outside
					on:click_outside={() =>
						search_string.length == 0 ? (show_search = false) : null}
				>
					<button on:click={() => (search_string = "")} class="contents">
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
						class="{show_search
							? 'dark:bg-slate-800 bg-slate-300 pl-8 ring-blue-200  ring-opacity-50 dark:ring-0 dark:border-gray-600 visible pr-7'
							: 'hidden'}
							peer w-full  border-transparent rounded-lg 
							placeholder:text-gray-400
							checked:shadow-inner
							dark:text-gray-200
							dark:placeholder:text-gray-500
							text-sm
							font-normal
							focus:ring-transparent
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
			<div class="w-full bg-slate-400 rounded-full h-1.5  dark:bg-slate-200 ">
				<div
					class="bg-[#ce6400] h-1.5 rounded-full"
					style="width: {selected_node.properties.length == 0
						? progress.toString()
						: 100}%"
				/>
			</div>
		</div>

		{#if selected_node.properties.length > 0 && selected_property === undefined}
			<div class="flex mb-1">
				{#each sort_options as sort_option}
					<button
						class={`select-none gap-2 flex flex-none items-center justify-center p-2 cursor-pointer  leading-snug transform transition-all !text-opacity-80 hover:!text-opacity-100 ${
							sort_by !== sort_option
								? "text-black dark:text-white"
								: "text-orange-500"
						} 
						${sort_option == "count" ? "ml-auto" : ""}
						`}
						on:click={() => sort(sort_option)}
					>
						<span class="capitalize "
							>{sort_option != "direction" ? sort_option : ""}</span
						>
						<svg
							width="1em"
							height="1em"
							class="fill-current text-[10px] {sort_by === sort_option &&
							sort_direction === 1
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
						on:click={() =>
							selected_node &&
							property_clicked(selected_node.id, property.property)}
						class="button flex px-2 rounded-lg bg-transparent h-10 hover:bg-black/10 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
					>
						<div
							title={`${
								property.property.in_count < property.property.out_count
									? `Target of`
									: `Source of`
							} "${property.property.label}"`}
						>
							<Icon
								src={property.property.in_count < property.property.out_count
									? ArrowRightOnRectangle
									: ArrowLeftOnRectangle}
								theme="solid"
								class="h-5 w-5  mr-3"
								title="test"
							/>
						</div>
						{#if property.property.label}
							<span class="truncate" title={property.property.label}>
								{#if property.matches && property.matches.length > 0}
									{property.property.label.slice(
										0,
										property.matches[0].indices[0][0]
									)}{#each property.matches[0].indices as indice, index}
										<span class="text-orange-500"
											>{property.property.label.slice(
												indice[0],
												indice[1] + 1
											)}</span
										>{property.property.label.slice(
											indice[1] + 1,
											property.matches[0].indices[index + 1]?.[0] ??
												property.property.label.length
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
							class="ml-auto w-6 bg-white rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
							>{property.property.in_count + property.property.out_count}</span
						>
					</button>
				{/each}
			</div>
		{:else if selected_property_nodes.length > 0}
			<div class="flex justify-between items-center mb-1">
				<div class="flex h-10 pl-2">
					<div class="flex items-center cursor-pointer">
						<input
							id="select_all"
							type="checkbox"
							on:change={toggle_all_nodes}
							checked={selected_nodes.length === selected_property_nodes.length}
							class="cursor-pointer w-4 h-4 text-[#CE6400] bg-gray-100 rounded border-gray-300 focus:ring-[#CE6400] dark:focus:ring-[#CE6400] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 checked:bg-[#CE6400] dark:checked:bg-[#CE6400]"
						/>
						<label
							for="select_all"
							class="cursor-pointer ml-2 font-medium text-gray-900 dark:text-gray-300 select-none"
							>Select All</label
						>
					</div>
				</div>
				<div>
					{selected_nodes.length} / {sorted_nodes.length}
				</div>
			</div>
			<ul
				class="dark:bg-white/5 rounded-lg mx-2  overflow-y-auto  flex flex-col gap-2 flex-grow"
			>
				{#each sorted_nodes as node}
					<li
						class="px-3 rounded-lg bg-transparent flex transition-all duration-200 ease-in-out"
					>
						<div class="flex items-center cursor-pointer min-w-0">
							<input
								id={node.node.id}
								type="checkbox"
								value={node.node}
								bind:group={selected_nodes}
								class="cursor-pointer w-4 h-4 text-[#CE6400] bg-gray-100 rounded border-gray-300 focus:ring-[#CE6400] dark:focus:ring-[#CE6400] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 checked:bg-[#CE6400] dark:checked:bg-[#CE6400]"
							/>
							<label
								for={node.node.id}
								class="cursor-pointer ml-2 font-medium text-gray-900 dark:text-gray-300 select-none truncate"
								>{#if node.node.label}
									<span class="" title={node.node.label}>
										{#if node.matches && node.matches.length > 0}
											{node.node.label.slice(
												0,
												node.matches[0].indices[0][0]
											)}{#each node.matches[0].indices as indice, index}
												<span class="text-orange-500"
													>{node.node.label.slice(
														indice[0],
														indice[1] + 1
													)}</span
												>{node.node.label.slice(
													indice[1] + 1,
													node.matches[0].indices[index + 1]?.[0] ??
														node.node.label.length
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
					</li>
				{/each}
			</ul>
			<button
				on:click={add_selected}
				class="ml-auto gr-button-primary gr-button !block mt-2 mr-2 h-8 flex-shrink-0 !text-base "
				>Add selected</button
			>
		{:else}
			<div class="properties m-auto w-full items-center justify-center p-5">
				<div role="status">
					<svg
						aria-hidden="true"
						class="mr-2 w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-[#CE6400]"
						viewBox="0 0 100 101"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
							fill="currentColor"
						/>
						<path
							d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
							fill="currentFill"
						/>
					</svg>
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
