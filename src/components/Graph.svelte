<script lang="ts">
	import ContextMenu from './Context-Menu.svelte';
	import PropertyMenu from './Property-Menu.svelte';
	import { Graph, type URI, type Node, CurrentGraph } from '../api/graph';
	import ActionMenu from './Header.svelte';
	import InformationMenu from './Information-Menu.svelte';
	import { onDestroy, onMount } from 'svelte';
	import GraphLoader from './loader/Graph-Loader.svelte';
	import { LoaderManager } from './loader/graph-loader';
	import { copy_to_clipboard } from '../util';
	import { ModalManager } from './modal/modal-store';
	import AddNodes from './modal/modals/Add-Nodes.svelte';
	import Export from './modal/modals/Export.svelte';
	import Settings from './modal/modals/Settings.svelte';

	interface ClickEvent {
		edges: [];
		event: any;
		items: [];
		nodes: URI[];
		pointer: {
			DOM: { x: number; y: number };
			canvas: { x: number; y: number };
		};
	}

	let container: HTMLElement;
	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };
	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;
	let show_node_information: Node | undefined = undefined;
	let loading_properties: boolean = false;

	let is_ready = false;

	onMount(() => {
		is_ready = false;
		init();
		is_ready = true;
	});

	onDestroy(() => {
		destory();
	});

	function destory() {
		$CurrentGraph.network.off('stabilizationProgress');
		$CurrentGraph.network.off('stabilizationIterationsDone');
		$CurrentGraph.network.off('stabilized');
		$CurrentGraph.network.off('startStabilizing');
		$CurrentGraph.network.off('oncontext');
		$CurrentGraph.network.off('click');
		$CurrentGraph.network.destroy();
		$CurrentGraph.container.remove();

		document.removeEventListener('keydown', handle_keydown);
	}

	function init() {
		if (container && $CurrentGraph.container !== container) {
			destory();

			$CurrentGraph = new Graph(container);
			$CurrentGraph.network.on('click', show_properties);
			$CurrentGraph.network.on('oncontext', show_context_menu);
			$CurrentGraph.network.on('startStabilizing', () => {
				LoaderManager.open();
			});
			$CurrentGraph.network.on('stabilized', () => {
				LoaderManager.close();
			});
			$CurrentGraph.network.on('stabilizationIterationsDone', () => {
				LoaderManager.close();
			});
			$CurrentGraph.network.on('stabilizationProgress', (params) => {
				LoaderManager.set_status(
					'stabilizing',
					Math.round((params.iterations / params.total) * 100)
				);
			});
			document.addEventListener('keydown', handle_keydown);
		}
	}

	function handle_keydown(event: KeyboardEvent) {
		if (!$CurrentGraph) return;

		if (event.key === 'z' && event.ctrlKey) {
			$CurrentGraph.undo();
		} else if (event.key === 'y' && event.ctrlKey) {
			$CurrentGraph.redo();
		} else if (event.key === 'Escape') {
			hide_context_menu = true;
			selected_node = undefined;
			show_node_information = undefined;
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			if (!/input|textarea/i.test(document.activeElement?.tagName ?? '')) {
				let node_id = $CurrentGraph.network.getSelectedNodes()[0];
				const node = $CurrentGraph.get_node(node_id as string);
				if (node && !selected_node) $CurrentGraph.hide_node(node);
			}
		} else if (event.key === 'c' && event.ctrlKey) {
			if (!/input|textarea/i.test(document.activeElement?.tagName ?? '')) {
				let node_id = $CurrentGraph.network.getSelectedNodes()[0];
				const node = $CurrentGraph.get_node(node_id as string);
				if (node && !selected_node && event) {
					copy_to_clipboard(node.id);
				}
			}
		} else if (event.key === 'i' && event.ctrlKey) {
			// show node information
			let node_id = $CurrentGraph.network.getSelectedNodes()[0];
			const node = selected_node ?? $CurrentGraph.get_node(node_id as string);
			if (node) {
				show_node_information = node;
			}
		} else if (event.key === 'n' && event.ctrlKey && event.altKey) {
			ModalManager.open(AddNodes);
		} else if (event.key === 's' && event.ctrlKey) {
			event.preventDefault();
			ModalManager.open(Export);
		} else if (event.key === 's' && event.altKey) {
			ModalManager.open(Settings);
		} else if (event.key === 'S' && event.shiftKey) {
			if (!/input|textarea/i.test(document.activeElement?.tagName ?? '')) {
				$CurrentGraph.network?.stabilize();
			}
		} else if (event.key === 'F' && event.shiftKey) {
			if (!/input|textarea/i.test(document.activeElement?.tagName ?? '')) {
				event.preventDefault();
				let node_id = $CurrentGraph.network.getSelectedNodes()[0];
				const node = selected_node ?? $CurrentGraph.get_node(node_id as string);
				if (node) {
					$CurrentGraph.add_filter(node);
					$CurrentGraph = $CurrentGraph;
				}
			}
		}
	}

	function show_context_menu(event: ClickEvent) {
		event.event.preventDefault();
		selected_node = undefined;
		const uri = $CurrentGraph.network.getNodeAt(event.pointer.DOM) as URI;
		const node = $CurrentGraph.get_node(uri);
		node ? (context_selection = node) : (context_selection = undefined);
		hide_context_menu = false;
		menu_position = event.pointer.DOM;
	}

	function show_properties(event: ClickEvent) {
		hide_context_menu = true;
		if ($CurrentGraph.network.getSelectedNodes().length > 0) {
			const uri = event.nodes[0];
			const node = $CurrentGraph.get_node(uri);
			if (!node || node.type === 'literal') return;

			selected_node = node;
			const node_position = $CurrentGraph.network.canvasToDOM(
				$CurrentGraph.network.getPosition(uri)
			);
			menu_position = node_position;

			loading_properties = true;
			$CurrentGraph.get_properties(uri).then((node) => {
				if (hide_context_menu && selected_node === node) selected_node = node;
				loading_properties = false;
			});
		} else {
			selected_node = undefined;
		}
	}
</script>

<div bind:this={container} class="w-full h-full" />
{#if is_ready}
	<InformationMenu bind:node={show_node_information} />
	<PropertyMenu
		{menu_position}
		{selected_node}
		loading={loading_properties}
		information_tab_visible={show_node_information !== undefined}
	/>
	<ContextMenu
		on_information={(node) => (show_node_information = node)}
		{menu_position}
		bind:hidden={hide_context_menu}
		selection={context_selection}
		information_tab_visible={show_node_information !== undefined}
	/>
	<ActionMenu />
	<GraphLoader />
{/if}
