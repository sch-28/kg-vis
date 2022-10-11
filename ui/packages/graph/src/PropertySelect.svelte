<script lang="ts">
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	export let properties: string[] = [];
	export let node: string = "";
</script>

<div class="wrapper">
	<h2>{node}</h2>
	<div class="properties">
		{#each properties as property}
			<button
				on:click={() =>
					dispatch("property_clicked", { node: node, property: property })}
				>{property}</button
			>
		{/each}
	</div>
</div>

<style>
	.wrapper {
		position: absolute;
		top: 0;
		right: 0;
	}

	.properties {
		overflow: scroll;
		max-height: 200px;

		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
