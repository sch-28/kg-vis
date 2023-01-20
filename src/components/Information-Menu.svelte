<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import type { Node } from '../api/graph';
	export let node: Node | undefined;

    $: console.log(node)
</script>

{#if node}
	<div
		class="p-4 h-4/5 top-1/2 -translate-y-1/2 absolute right-4 w-80 shadow-lg rounded-lg border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<h1 class="text-lg font-bold">{node.label}</h1>
	</div>
{/if}
