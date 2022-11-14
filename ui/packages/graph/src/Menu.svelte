<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Property, URI } from "./types";

	const dispatch = createEventDispatcher();

	export let properties: Property[] = [];
	export let node: URI = "";
	export let menu_position = { x: 0, y: 0 };
	export let progress = 0;

	let wrapper: HTMLElement;

	$: {
		if (wrapper) {
			wrapper.style.top = menu_position.y + "px";
			wrapper.style.left = menu_position.x + "px";
		}
	}
</script>

{#if node.length > 0}
	<div class="wrapper" bind:this={wrapper}>
		<div class="properties">
			{#if properties.length > 0}
				{#each properties as property}
					<!-- <button on:click={() => dispatch("property_clicked", { uri: node, property: id })}
						>{properties[id].length}x {properties[id][0].label}</button
					> -->
					<button
						on:click={() =>
							dispatch("property_clicked", { uri: node, property: property })}
						class="flex ml-1 px-2 py-0.5 rounded border-transparent dark:border-transparent bg-transparent dark:text-white h-10 dark:hover:border-white border-solid border transition-all duration-200 ease-in-out"
					>
						<span>{property.label ?? property.uri}</span>
						<span
							class="ml-auto w-6 bg-white rounded-full inline-flex items-center justify-center -mb-0.5 text-xs font-semibold  p-1 "
							>{property.in_count + property.out_count}</span
						>
					</button>
				{/each}
			{:else}
				<div class="m-auto w-4/5">
					<h2 class="mb-2">Loading...</h2>
					<!-- <div progress={progress.toString()} /> -->
					<div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
						<div
							class="bg-blue-600 h-2.5 rounded-full"
							style="width: {progress.toString()}%"
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.wrapper {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.8);
		padding: 10px;
		border-radius: 20px;
		width: fit-content;
	}

	.properties {
		overflow-y: auto;
		max-height: 200px;
		width: 350px;
		max-width: 350px;
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
