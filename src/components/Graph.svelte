<script lang="ts">
	import type { Network, Options } from 'vis-network';
	import * as vis from 'vis-network';
	import ContextMenu from './Context-Menu.svelte';
	import Menu from './Property-Menu.svelte';
	import { Graph, type URI, type Node } from '../api/graph';
	import { Toaster } from 'svelte-french-toast';
	import { dark_mode } from '../util';
	import ActionMenu from './Action-Menu.svelte';
	import ToastManager from './Toast-Manager.svelte';
	import InformationMenu from './Information-Menu.svelte';

	let container: HTMLElement;

	let graph: Graph;
	let network: Network;

	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };

	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;

	let show_node_information: Node | undefined = undefined;

	let loading_properties: boolean = false;

	export let value: string;

	$: if (value) {
		create_graph(value);
	}

	async function create_graph(starting_point: string) {
		graph = new Graph();

		await graph.load_node(starting_point);
		graph.update_data();

		const options: Options = {
			nodes: {
				color: dark_mode ? '#6a7e9d' : '#74a0e9',
				shape: 'dot',
				font: {
					color: dark_mode ? 'white' : 'black'
				},
				borderWidth: 3,
				chosen: false
			},
			edges: {
				font: {
					strokeWidth: 0,
					color: dark_mode ? 'white' : 'black',
					background: dark_mode ? '#111827' : 'white'
				},
				color: {
					color: dark_mode ? '#4a5e7d' : '#74a0e9',
					highlight: dark_mode ? '#4a5e7d' : '#74a0e9'
				},
				labelHighlightBold: false
			},
			physics: {
				solver: 'forceAtlas2Based',
				forceAtlas2Based: {
					gravitationalConstant: -75,
					springLength: 100,
					springConstant: 0.02
				},
				maxVelocity: 50,
				minVelocity: 3,
				timestep: 0.35
			}
		};
		network = new vis.Network(container, graph.data, options);
		graph.set_network(network);

		// temporary fix to center node on load
		setTimeout(() => {
			network.fit({ animation: { duration: 0, easingFunction: 'easeInOutQuad' } });
		}, 4);

		network.on('click', show_properties);
		network.on('oncontext', show_context_menu);
	}

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

	function show_context_menu(event: Click_Event) {
		event.event.preventDefault();
		selected_node = undefined;
		const uri = network.getNodeAt(event.pointer.DOM) as URI;
		const node = graph.get_node(uri);
		node ? (context_selection = node) : (context_selection = undefined);
		hide_context_menu = false;
		menu_position = event.pointer.DOM;
	}

	function show_properties(event: Click_Event) {
		hide_context_menu = true;
		if (network.getSelectedNodes().length > 0) {
			const uri = event.nodes[0];
			const node = graph.get_node(uri);
			if (!node || node.type === 'literal') return;

			selected_node = node;
			const node_position = network.canvasToDOM(network.getPosition(uri));
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
<ToastManager />
<InformationMenu node={show_node_information} {graph} />
<div bind:this={container} class="w-full h-full" />
<Menu
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
