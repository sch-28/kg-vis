<script lang="ts">
	import { getContext } from 'svelte';

	const test = getContext('action') as Function;
    
</script>

<button on:click={() => test()} >Test</button>
