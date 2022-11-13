<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Properties, Property, URI } from "./types";
	import { Badge, Button } from "flowbite-svelte";

	const dispatch = createEventDispatcher();

	export let properties: Property[] = [];
	export let node: URI = "";
	export let menu_position = { x: 0, y: 0 };

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
					<Button
						color="primary"
						on:click={() => dispatch("property_clicked", { uri: node, property: property })}
						btnClass="flex"
					>
						<span>{property.label ?? property.uri}</span>
						<Badge rounded class="ml-auto w-5 h-5 bg-white">{property.in_count + property.out_count}</Badge>
					</Button>
				{/each}
			{:else}
				LOADING
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
	}

	.properties {
		overflow-y: scroll;
		max-height: 200px;
		width: 350px;
		max-width: 350px;
		height: 200px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	button {
		background-color: rgba(255, 255, 255, 0.9);
		color: black;
		text-align: left;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		min-height: 43px;
		display: block;
		max-height: 100px;
	}
</style>
