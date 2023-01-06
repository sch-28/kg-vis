<script lang="ts">
	import { Cog6Tooth, PencilSquare, PlusCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import type { Graph } from 'src/api/graph';
	import { setContext } from 'svelte';
	import { bind } from 'svelte-simple-modal';
	import type { Action } from './actions/action';
	import AddAction from './actions/Add-Action.svelte';
	import Modal from './actions/Modal.svelte';

	export let graph: Graph;

	let current_action: Action | null | undefined = null;

	setContext('close', close_modal);

	function close_modal() {
		current_action = null;
	}

	function open_add_action() {
		if (current_action === AddAction) current_action = null;
		else current_action = bind(AddAction as any, { graph }) as unknown as Action;
	}
</script>

<div
	class="absolute top-0 left-1/2 -translate-x-1/2 shadow-lg rounded-b-lg flex gap-10 bg-white/5 py-4 px-6"
>
	<button class="flex items-center gap-2 cursor-pointer" on:click={open_add_action}>
		<Icon src={PlusCircle} class="w-6 h-6" />Add Node(s)
	</button>
	<button class="flex items-center gap-2 cursor-pointer">
		<Icon src={PencilSquare} class="w-6 h-6" />Edit Graph
	</button>
	<button class="flex items-center gap-2 cursor-pointer">
		<Icon src={Cog6Tooth} class="w-6 h-6" />Settings
	</button>
</div>

<Modal bind:content={current_action} />
