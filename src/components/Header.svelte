<script lang="ts">
	import { CheckCircle, Cog6Tooth, PencilSquare } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import type { Graph } from 'src/api/graph';
	import { onMount } from 'svelte';
	import AddAction from './modal/modals/Add-Nodes.svelte';
	import Settings from './modal/modals/Settings.svelte';
	import PlusCircleOutline from 'svelte-material-icons/PlusCircleOutline.svelte';
	import { Modal_Manager, type Component } from './modal/modal-store';

	export let graph: Graph;

	function open(action: Component) {
		Modal_Manager.open(action, { graph });
	}

	let physics_enabled: boolean = true;

	function toggle_edit() {
		physics_enabled = !physics_enabled;
		graph.network?.setOptions({
			physics: physics_enabled
		});
	}

	$: graph && graph.nodes.length === 0 && open(AddAction);
</script>

<div
	class="absolute top-4 left-1/2 -translate-x-1/2 shadow-lg rounded-lg flex gap-10  py-4 px-6 border dark:border-dark-muted dark:bg-dark-bg bg-white z-50"
>
	<button class="flex items-center gap-2 cursor-pointer" on:click={() => open(AddAction)}>
		<div class="w-6 h-6">
			<PlusCircleOutline width="100%" height="100%" />
		</div>
		Add
	</button>
	<button
		class="flex items-center gap-2 cursor-pointer min-w-[70px] justify-center"
		on:click={toggle_edit}
	>
		<Icon src={physics_enabled ? PencilSquare : CheckCircle} class="w-6 h-6" />{physics_enabled
			? 'Edit'
			: 'Done'}
	</button>
	<button class="flex items-center gap-2 cursor-pointer" on:click={() => open(Settings)}>
		<Icon src={Cog6Tooth} class="w-6 h-6" />Settings
	</button>
</div>
