<script lang="ts">
	import { Play } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Button, Popover } from 'flowbite-svelte';
	import { CurrentGraph } from '../api/graph';
	import LoadingCircle from './util/Loading-Circle.svelte';

	export let loading_graph: boolean = false;
</script>

{#if loading_graph}
	<div class="absolute bottom-4 right-4 w-8 h-8 flex justify-center items-center z-50">
		<LoadingCircle />
		<Popover class="w-44 text-sm font-normal [&>*:nth-child(2)]:p-0" title="Graph is stabilizing">
			<div class="flex flex-col items-start">
				<Button
					on:click={() => {
						$CurrentGraph.simulation_running = false;
						$CurrentGraph.network.stopSimulation();
					}}
					color="light"
					btnClass="rounded-b-lg py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Stop animation</Button
				>
				<Button
					on:click={() => $CurrentGraph.network.stabilize()}
					color="light"
					btnClass="py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Stabilize</Button
				>
			</div>
		</Popover>
	</div>
{:else if $CurrentGraph && $CurrentGraph.data.nodes.length > 0}
	<div class="absolute bottom-4 right-4 w-8 h-8 flex justify-center items-center z-50">
		<Icon src={Play} />
		<Popover class="w-44 text-sm font-normal [&>*:nth-child(2)]:p-0" title="Graph is resting">
			<div class="flex flex-col items-start">
				<Button
					on:click={() => {
						$CurrentGraph.simulation_running = true;
						$CurrentGraph.network.startSimulation();
					}}
					color="light"
					btnClass="py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Start animation</Button
				>
				<Button
					on:click={() => $CurrentGraph.network.stabilize()}
					color="light"
					btnClass="rounded-b-lg py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Stabilize</Button
				>
			</div>
		</Popover>
	</div>
{/if}
