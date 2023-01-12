<script lang="ts">
	import { onMount } from 'svelte';
	import type { Network, Options } from 'vis-network';
	import * as vis from 'vis-network';
	import ContextMenu from './Context-Menu.svelte';
	import Menu from './Property-Menu.svelte';
	import { Graph, Property, type URI, type Node } from '../api/graph';
	import toast, { Toaster } from 'svelte-french-toast';
	import { dark_mode } from '../util';
	import ActionMenu from './Action-Menu.svelte';

	let container: HTMLElement;

	let graph: Graph;
	let network: Network;

	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };

	let last_click = { x: 0, y: 0 };

	let progress = 0;

	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;

	export let value: string;
	export let endpoint: string = 'https://query.wikidata.org/sparql';
	export let rate_limit: number = 5;
	export let size_limit: number = 100;

	$: {
		endpoint, size_limit, rate_limit;
		if (value && value.length > 0) {
			create_graph(value);
		}
	}

	async function create_graph(starting_point: string) {
		graph = new Graph(+rate_limit, +size_limit, endpoint);

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
				maxVelocity: 25,
				minVelocity: 1.5,

				barnesHut: {
					springLength: 175
				},
				timestep: 0.5
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
			progress = 0;
			const uri = event.nodes[0];
			const node = graph.get_node(uri);
			if (!node || node.type === 'literal') return;

			selected_node = node;
			const node_position = network.canvasToDOM(network.getPosition(uri));
			menu_position = node_position;
			last_click = event.pointer.canvas;

			graph.get_properties(uri, set_progress).then((node) => {
				if (hide_context_menu) selected_node = node;
			});
		} else {
			selected_node = undefined;
		}
	}

	function set_progress(new_progress: number) {
		progress = new_progress;
	}
</script>

<Toaster />
<div bind:this={container} class="w-full h-full" />
<Menu {menu_position} {selected_node} {progress} {graph} />
<ContextMenu
	{menu_position}
	bind:hidden={hide_context_menu}
	selection={context_selection}
	{graph}
/>
<ActionMenu {graph} />
