<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Properties, URI } from "./types";
	import { Badge, Button } from "flowbite-svelte";

	const dispatch = createEventDispatcher();

	export let properties: Properties = {};
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
			{#if Object.keys(properties).length > 0}
				{#each Object.keys(properties) as id}
					<!-- <button on:click={() => dispatch("property_clicked", { uri: node, property: id })}
						>{properties[id].length}x {properties[id][0].label}</button
					> -->
					<Button
						color="primary"
						on:click={() => dispatch("property_clicked", { uri: node, property: id })}
						btnClass="flex"
					>
						<span>{properties[id][0].label}</span>
						<Badge
							rounded
							class="ml-auto w-5 h-5"
							>{properties[id].length}</Badge
						>
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
		width: 400px;
		max-width: 400px;
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
