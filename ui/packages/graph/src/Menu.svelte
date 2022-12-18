<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Property, URI, Node } from "./types";
	import { Icon } from "@steeze-ui/svelte-icon";
	import {
		MagnifyingGlass,
		Link,
		ArrowRightOnRectangle,
		ArrowLeftOnRectangle,
		XMark
	} from "@steeze-ui/heroicons";
	import Fuse from "fuse.js";
	import { click_outside } from "./util/util";

	const dispatch = createEventDispatcher();

	export let selected_node: Node | undefined = undefined;
	export let menu_position = { x: 0, y: 0 };
	export let progress = 0;

	type SortDirection = 1 | -1;
	type SortOptions = "name" | "count" | "direction";
	const sort_options: SortOptions[] = ["direction", "name", "count"];
	let sort_direction: SortDirection = -1;
	let sort_by: SortOptions = "name";
	let sorted_properties: {
		property: Property;
		matches?: readonly Fuse.FuseResultMatch[];
	}[] = [];

	let search_property: string = "";
	let search_input: HTMLInputElement;
	let show_search: boolean = false;

	let wrapper: HTMLElement;

	$: {
		if (wrapper) {
			wrapper.style.top = menu_position.y + "px";
			wrapper.style.left = menu_position.x + "px";
		}
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
		search_property;
		if (selected_node && selected_node.properties.length > 0) {
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
			if (search_property.length > 0) {
				const fuse = new Fuse(selected_node.properties, {
					keys: ["label"],
					includeMatches: true,
					threshold: 0.3,
					minMatchCharLength: 2,
					shouldSort: true,
				});
				properties = fuse.search(search_property).map((result) => {
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

	function search(event: KeyboardEvent) {
		if (!show_search || document.activeElement !== search_input) {
			search_property += event.key;
			show_search = true;
			setTimeout(() => {
				search_input?.focus();
			}, 0);
		} else {
		}
	}
</script>

{#if selected_node}
	<div
		class="wrapper bg-slate-200 dark:bg-[#1f2937] shadow-md"
		on:mouseover={() => document.addEventListener("keypress", search)}
		on:focus={() => document.addEventListener("keypress", search)}
		on:mouseout={() => document.removeEventListener("keypress", search, false)}
		on:blur={() => document.removeEventListener("keypress", search, false)}
		bind:this={wrapper}
	>
		<div class="text-lg font-bold mx-2 flex items-center gap-5 justify-between">
			<h1 class="truncate" title={selected_node.label}>
				{selected_node.label}
			</h1>
			<div class="flex items-center gap-3">
				<div
					class="w-6 h-10 relative transition-all {show_search
						? 'w-36'
						: 'cursor-pointer'}"
					on:click={() => {
						show_search = true;
						setTimeout(() => search_input.focus(), 0);
					}}
					use:click_outside
					on:click_outside={() =>
						search_property.length == 0 ? (show_search = false) : null}
				>
					<div on:click={() => (search_property = "")}>
						<Icon
							src={XMark}
							theme="solid"
							class="h-5 w-5  absolute z-10 bottom-1/2 translate-y-1/2 cursor-pointer right-2 {show_search &&
							search_property.length > 0
								? 'visible'
								: 'hidden'}"
						/>
					</div>
					<input
						bind:this={search_input}
						bind:value={search_property}
						type="text"
						class="{show_search
							? 'dark:bg-slate-800 bg-slate-300 pl-8 ring-blue-200  ring-opacity-50 dark:ring-0 dark:border-gray-600 visible pr-7'
							: 'hidden'}
							peer w-full  border-transparent rounded-md 
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
				</div>
				<a href={selected_node.id} target="_blank">
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

		{#if selected_node.properties.length > 0}
			<div class="flex  mb-1 ">
				{#each sort_options as sort_option}
					<div
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
					</div>
				{/each}
			</div>
			<div class="properties">
				{#each sorted_properties as property}
					<button
						on:click={() =>
							selected_node &&
							dispatch("property_clicked", {
								uri: selected_node.id,
								property: property.property
							})}
						class="flex px-2 rounded bg-transparent h-10 hover:bg-black/10 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
					>
						<div
							title={`${
								property.property.in_count > property.property.out_count
									? `Target of`
									: `Source of`
							} "${property.property.label}"`}
						>
							<Icon
								src={property.property.in_count > property.property.out_count
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
		{:else}
			<div class="properties m-auto w-4/5 items-center justify-center p-5">
				<h2 class="mb-2 text-lg">Loading...</h2>
			</div>
		{/if}
	</div>
{/if}

<style>
	.wrapper {
		position: absolute;
		padding: 10px;
		border-radius: 20px;
		max-width: 380px;
		width: 380px;
	}

	.properties {
		overflow-y: auto;
		max-height: 200px;
		height: 200px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	button {
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		min-height: 40px;
		max-height: 40px;
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
