<script lang="ts">
	import { Icon } from '@steeze-ui/svelte-icon';
	import {
		MagnifyingGlass,
		InformationCircle,
		LockClosed,
		Trash,
		LockOpen,
		ClipboardDocument,
		Photo,
		ArrowsPointingOut,
		Funnel,
		ArrowPathRoundedSquare
	} from '@steeze-ui/heroicons';
	import { CurrentGraph, type Node } from '../api/graph';
	import type { IconSource } from '@steeze-ui/svelte-icon/types';
	import { copy_to_clipboard } from '../util';
	import { ModalManager } from './modal/modal-store';
	import GraphInformation from './modal/modals/Graph-Information.svelte';
	import Export from './modal/modals/Export.svelte';
	import { Hr } from 'flowbite-svelte';
	import ConfirmDialog from './modal/modals/Confirm-Dialog.svelte';
	export let menu_position = { x: 0, y: 0 };
	export let hidden = true;
	export let selection: Node | undefined = undefined;
	export let on_information: (node: Node) => void;
	export let information_tab_visible: boolean = false;

	let wrapper: HTMLElement;
	const menu_gap = 16;

	type Action = {
		icon: IconSource;
		label: string;
		handle: () => void;
		danger?: boolean;
	};

	const node_actions = (): (Action | 'split')[] => [
		{
			icon: InformationCircle,
			label: 'Information',
			handle: handle_information
		},
		{
			icon: Funnel,
			label: 'Filter',
			handle: handle_filter
		},
		{
			icon: MagnifyingGlass,
			label: 'Focus',
			handle: handle_focus
		},
		{
			icon: ClipboardDocument,
			label: 'Copy URI',
			handle: handle_clipboard_uri
		},
		'split',
		{
			icon: selection && selection.fixed ? LockOpen : LockClosed,
			label: selection && selection.fixed ? 'Unlock' : 'Lock',
			handle: handle_lock
		},
		{
			icon: Trash,
			label: 'Delete',
			handle: handle_delete,
			danger: true
		}
	];

	const canvas_actions = (): (Action | 'split')[] => [
		{
			icon: InformationCircle,
			label: 'Information',
			handle: handle_graph_information
		},
		'split',
		{
			icon: ArrowsPointingOut,
			label: 'Fit graph',
			handle: handle_fit_graph
		},
		{
			icon: ArrowPathRoundedSquare,
			label: 'Stabilize',
			handle: handle_stabilize
		},
		{
			icon: Photo,
			label: 'Export',
			handle: handle_export
		},
		'split',
		{
			icon: LockClosed,
			label: 'Lock all',
			handle: handle_lock_all
		},
		{
			icon: LockOpen,
			label: 'Unlock all',
			handle: handle_unlock_all
		},
		'split',
		{
			icon: Trash,
			label: 'Delete all',
			handle: handle_delete_all,
			danger: true
		}
	];

	let current_actions: (Action | 'split')[] = node_actions();

	$: wrapper && menu_position && set_position();

	$: {
		current_actions = selection ? node_actions() : canvas_actions();
	}

	function handle_export() {
		ModalManager.open(Export);
		hidden = true;
	}
	function handle_filter() {
		if (selection) {
			$CurrentGraph.add_filter(selection);
			CurrentGraph.update((u) => $CurrentGraph);
		}
		hidden = true;
	}
	function handle_stabilize() {
		$CurrentGraph.network?.stabilize();
		hidden = true;
	}

	function handle_fit_graph() {
		$CurrentGraph.network?.fit();
		hidden = true;
	}

	function handle_unlock_all() {
		$CurrentGraph.lock_all_nodes(false);
		hidden = true;
	}

	function handle_lock_all() {
		$CurrentGraph.lock_all_nodes(true);
		hidden = true;
	}

	function handle_delete_all() {
		hidden = true;
		ModalManager.open(ConfirmDialog, {
			message: `Are you sure you want to remove all nodes?`,
			on_confirm: () => {
				$CurrentGraph.reset();
				hidden = true;
			}
		});
	}

	function handle_graph_information() {
		ModalManager.open(GraphInformation);
		hidden = true;
	}

	function handle_clipboard_uri() {
		if (selection) {
			copy_to_clipboard(selection.id);
		}
		hidden = true;
	}

	function set_position() {
		const new_position = { x: menu_position.x, y: menu_position.y };
		let window_width = window.innerWidth;
		if (information_tab_visible) {
			window_width -= 400;
		}
		if (new_position.x + wrapper.offsetWidth > window_width) {
			new_position.x = window_width - wrapper.offsetWidth - menu_gap;
		}
		if (new_position.y + wrapper.offsetHeight > window.innerHeight) {
			new_position.y = window.innerHeight - wrapper.offsetHeight - menu_gap;
		} else if (new_position.y - wrapper.offsetHeight < 0) {
			new_position.y = menu_gap;
		}

		wrapper.style.top = new_position.y + 'px';
		wrapper.style.left = new_position.x + 'px';
	}

	function handle_delete() {
		if (selection) {
			$CurrentGraph.hide_node(selection);
		}
		hidden = true;
	}

	function handle_focus() {
		if (selection) {
			$CurrentGraph.network?.focus(selection.id, {
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
			$CurrentGraph.toggle_node_lock(
				selection,
				$CurrentGraph.network?.getPosition(selection.id) ?? { x: 0, y: 0 }
			);
		}
		hidden = true;
	}

	function handle_information() {
		if (selection) {
			on_information(selection);
		}
		hidden = true;
	}
</script>

{#if !hidden}
	<div
		bind:this={wrapper}
		class="border dark:border-dark-muted dark:bg-dark-bg bg-white shadow-md z-40 absolute p-2 rounded-lg"
	>
		<div class="context-menu">
			{#each current_actions as action}
				{#if action === 'split'}
					<!-- <hr class="my-1" /> -->
					<Hr divClass="my-1" />
				{:else}
					<button
						class="context-menu-item dark:hover:bg-black/30 hover:bg-black/10 {action.danger
							? 'text-error dark:text-error-dark'
							: ''}"
						on:click={action.handle}
					>
						<div class="icon">
							<Icon src={action.icon} />
						</div>

						{action.label}
					</button>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style lang="postcss">
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
