<script lang="ts">
	import ContextMenu from './Context-Menu.svelte';
	import PropertyMenu from './Property-Menu.svelte';
	import { Graph, type URI, type Node, CurrentGraph } from '../api/graph';
	import ActionMenu from './Header.svelte';
	import InformationMenu from './Information-Menu.svelte';
	import GraphControls from './Graph-Controls.svelte';
	import { onMount } from 'svelte';

	interface Click_Event {
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
	let loading_graph: boolean = false;

	onMount(() => {
		init();
	});

	$: container && init();

	function init() {
		if (container && $CurrentGraph.container !== container) {
			$CurrentGraph.network.destroy();
			$CurrentGraph.container.remove();

			$CurrentGraph = new Graph(container);
			$CurrentGraph.network.on('click', show_properties);
			$CurrentGraph.network.on('oncontext', show_context_menu);
			$CurrentGraph.network.on('startStabilizing', () => {
				loading_graph = true;
			});
			$CurrentGraph.network.on('stabilized', () => {
				$CurrentGraph.simulation_running = false;
				loading_graph = false;
			});
		}
	}

	function show_context_menu(event: Click_Event) {
		event.event.preventDefault();
		selected_node = undefined;
		const uri = $CurrentGraph.network.getNodeAt(event.pointer.DOM) as URI;
		const node = $CurrentGraph.get_node(uri);
		node ? (context_selection = node) : (context_selection = undefined);
		hide_context_menu = false;
		menu_position = event.pointer.DOM;
	}

	function show_properties(event: Click_Event) {
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

<InformationMenu bind:node={show_node_information} />
<div bind:this={container} class="w-full h-full" />
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
/>
<ActionMenu />
<GraphControls {loading_graph} />
