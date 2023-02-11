<script lang="ts">
	import { CheckCircle, Cog6Tooth, MagnifyingGlass, PencilSquare } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CurrentGraph } from '../api/graph';
	import AddAction from './modal/modals/Add-Nodes.svelte';
	import Settings from './modal/modals/Settings.svelte';
	import PlusCircleOutline from 'svelte-material-icons/PlusCircleOutline.svelte';
	import { ModalManager, type Component } from './modal/modal-store';
	import GraphFilter from './Graph-Filter.svelte';

	let open_add_nodes_on_boot: boolean = true;
	let open_filter: boolean = false;

	function open(action: Component) {
		ModalManager.open(action);
	}

	$: {
		if ($CurrentGraph && $CurrentGraph.nodes.length == 0 && open_add_nodes_on_boot) {
			open(AddAction);
			open_add_nodes_on_boot = false;
		}
	}

	$: {
		if ($CurrentGraph && $CurrentGraph.node_filters.length > 0) {
			open_filter = true;
		}
	}
</script>

<div class="absolute top-4 left-1/2 -translate-x-1/2  z-30">
	<div
		class="relative shadow-lg rounded-lg flex gap-2 sm:gap-10  py-4 px-6 border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
	>
		<button class="flex items-center gap-2 cursor-pointer" on:click={() => open(AddAction)}>
			<div class="w-6 h-6">
				<PlusCircleOutline width="100%" height="100%" />
			</div>
			Add
		</button>
		<button
			class="flex items-center gap-2 cursor-pointer"
			on:click={() => (open_filter = !open_filter)}
		>
			<Icon src={MagnifyingGlass} class="w-6 h-6" />Search
		</button>
		<button class="flex items-center gap-2 cursor-pointer" on:click={() => open(Settings)}>
			<Icon src={Cog6Tooth} class="w-6 h-6" />Settings
		</button>
	</div>

	<GraphFilter bind:open={open_filter} />
</div>
