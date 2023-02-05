<script lang="ts">
	import ContextMenu from './Context-Menu.svelte';
	import PropertyMenu from './Property-Menu.svelte';
	import { Graph, type URI, type Node } from '../api/graph';
	import { Toaster } from 'svelte-french-toast';
	import ActionMenu from './Header.svelte';
	import InformationMenu from './information-menu/Information-Menu.svelte';
	import Modal from './modal/Modal.svelte';

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
	let graph: Graph;
	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };
	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;
	let show_node_information: Node | undefined = undefined;
	let loading_properties: boolean = false;

	export let value: string;

	$: if (value && container) {
		graph = new Graph(container, value);
		graph.network.on('click', show_properties);
		graph.network.on('oncontext', show_context_menu);
	}

	function show_context_menu(event: Click_Event) {
		event.event.preventDefault();
		selected_node = undefined;
		const uri = graph.network.getNodeAt(event.pointer.DOM) as URI;
		const node = graph.get_node(uri);
		node ? (context_selection = node) : (context_selection = undefined);
		hide_context_menu = false;
		menu_position = event.pointer.DOM;
	}

	function show_properties(event: Click_Event) {
		hide_context_menu = true;
		if (graph.network.getSelectedNodes().length > 0) {
			const uri = event.nodes[0];
			const node = graph.get_node(uri);
			if (!node || node.type === 'literal') return;

			selected_node = node;
			const node_position = graph.network.canvasToDOM(graph.network.getPosition(uri));
			menu_position = node_position;

			loading_properties = true;
			graph.get_properties(uri).then((node) => {
				if (hide_context_menu && selected_node !== undefined) selected_node = node;
				loading_properties = false;
			});
		} else {
			selected_node = undefined;
		}
	}
</script>

<Toaster />
<InformationMenu bind:node={show_node_information} {graph} />
<div bind:this={container} class="w-full h-full" />
<PropertyMenu
	{menu_position}
	{selected_node}
	{graph}
	loading={loading_properties}
	information_tab_visible={show_node_information !== undefined}
/>
<ContextMenu
	on_information={(node) => (show_node_information = node)}
	{menu_position}
	bind:hidden={hide_context_menu}
	selection={context_selection}
	{graph}
/>
<ActionMenu {graph} />
<Modal />
