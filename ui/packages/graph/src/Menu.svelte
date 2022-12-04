<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Property, URI, Node } from "./types";
	import { Icon } from "@steeze-ui/svelte-icon";
	import { Link } from "@steeze-ui/heroicons";

	const dispatch = createEventDispatcher();

	export let selected_node: Node | undefined = undefined;
	export let node: URI = "";
	export let menu_position = { x: 0, y: 0 };
	export let progress = 0;

	type SortDirection = 1 | -1;
	type SortOptions = "name" | "count";
	const sort_options: SortOptions[] = ["name", "count"];
	let sort_direction: SortDirection = -1;
	let sort_by: SortOptions = "name";
	let sorted_properties: Property[] = [];

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
		if (selected_node && selected_node.properties.length > 0) {
			sorted_properties = [...selected_node.properties].sort((a, b) => {
				if (sort_by == "count") {
					return (
						sort_direction *
						(a.in_count + a.out_count <= b.in_count + b.out_count ? 1 : -1)
					);
				} else {
					if (!a.label || !b.label) return 1;
					return (
						sort_direction *
						(a.label.toLocaleLowerCase() <= b.label.toLocaleLowerCase()
							? 1
							: -1)
					);
				}
			});
		}
	}
</script>

{#if node.length > 0}
	<div
		class="wrapper bg-slate-200 dark:bg-slate-700 shadow-md "
		bind:this={wrapper}
	>
		{#if selected_node && selected_node.properties.length > 0}
			<div
				class="text-lg font-bold mx-2 flex items-center gap-5 justify-between"
			>
				<h1 class="truncate" title={selected_node.label}>
					{selected_node.label}
				</h1>
				<a href={selected_node.id} target="_blank">
					<Icon src={Link} theme="solid" class="h-5 w-5 cursor-pointer" />
				</a>
			</div>
			<hr
				class="my-2 mx-auto  h-1 bg-gray-100 rounded border-0  dark:bg-gray-800"
			/>
			<div class="flex justify-between mx-2 mb-1 ">
				{#each sort_options as sort_option}
					<div
						class={`gap-2 flex flex-none items-center justify-center p-2 cursor-pointer  leading-snug transform transition-all !text-opacity-80 hover:!text-opacity-100 ${
							sort_by !== sort_option
								? "text-black dark:text-white"
								: "text-orange-500"
						} `}
						on:click={() => sort(sort_option)}
					>
						<span class="capitalize select-none">{sort_option}</span>
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
							dispatch("property_clicked", { uri: node, property: property })}
						class="flex px-2 rounded bg-transparent h-10 hover:bg-black/30 transition-all duration-200 ease-in-out"
					>
						<span>{property.label ?? property.uri}</span>
						<span
							class="ml-auto w-6 bg-white rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
							>{property.in_count + property.out_count}</span
						>
					</button>
				{/each}
			</div>
		{:else}
			<div class="properties m-auto w-4/5 items-center justify-center p-5">
				<h2 class="mb-2">Loading...</h2>
				<div class="w-full bg-slate-400 rounded-full h-2.5 dark:bg-slate-200">
					<div
						class="bg-blue-600 h-2.5 rounded-full"
						style="width: {progress.toString()}%"
					/>
				</div>
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
