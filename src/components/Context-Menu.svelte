<script lang="ts">
	import { Icon } from '@steeze-ui/svelte-icon';
	import {
		MagnifyingGlass,
		InformationCircle,
		LockClosed,
		Trash,
		LockOpen
	} from '@steeze-ui/heroicons';
	import type { Graph, Node } from '../api/graph';
	export let menu_position = { x: 0, y: 0 };
	export let hidden = true;
	export let selection: Node | undefined = undefined;
	export let graph: Graph;
	let wrapper: HTMLElement;

	$: {
		if (wrapper) {
			wrapper.style.top = menu_position.y + 'px';
			wrapper.style.left = menu_position.x + 'px';
		}
	}

	function handle_delete() {
		if (selection) {
			graph.hide_node(selection);
		}
		hidden = true;
	}

	function handle_focus() {
		if (selection) {
			graph.network?.focus(selection.id, {
				scale: 1,
				animation: {
					duration: 1000,
					easingFunction: 'easeInOutQuad'
				}
			});
		}
		hidden = true;
	}

	function handle_lock() {
		if (selection) {
			graph.toggle_node_lock(selection, graph.network?.getPosition(selection.id) ?? { x: 0, y: 0 });
		}
		hidden = true;
	}

	function handle_information() {
		if (selection) {
			console.log(selection);
		}
		hidden = true;
	}
</script>

<div
	bind:this={wrapper}
	{hidden}
	class="border dark:border-dark-muted dark:bg-dark-bg bg-white shadow-md z-40 absolute p-2 rounded-lg"
>
	<div class="context-menu">
		{#if selection}
			<button
				class="context-menu-item dark:hover:bg-black/30 hover:bg-black/10"
				on:click={handle_information}
			>
				<div class="icon">
					<Icon src={InformationCircle} />
				</div>

				Information
			</button>
			<button
				class="context-menu-item dark:hover:bg-black/30 hover:bg-black/10"
				on:click={handle_focus}
			>
				<div class="icon">
					<Icon src={MagnifyingGlass} />
				</div>

				Focus
			</button>
			<button
				class="context-menu-item dark:hover:bg-black/30 hover:bg-black/10"
				on:click={handle_lock}
			>
				<div class="icon">
					<Icon src={selection.fixed ? LockOpen : LockClosed} />
				</div>

				{selection.fixed ? 'Unlock' : 'Lock'}
			</button>
			<button
				class="context-menu-item dark:hover:bg-black/30 hover:bg-black/10 text-[#EF4444]"
				on:click={handle_delete}
			>
				<div class="icon">
					<Icon src={Trash} />
				</div>

				Remove
			</button>
		{:else}
			Not implemented
		{/if}
	</div>
</div>

<style>
	.context-menu {
		display: flex;
		flex-direction: column;
	}
	.context-menu-item {
		@apply flex items-center py-0.5 px-1 cursor-pointer rounded-lg w-40 select-none;
	}

	.icon {
		@apply w-5 h-5 mr-2;
	}
</style>
