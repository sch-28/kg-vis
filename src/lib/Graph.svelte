<script lang="ts">
	import { onMount } from "svelte";
	import type { Network, Options } from "vis-network";
	import * as vis from "vis-network";
	import { fetch_properties } from "./api";
	import Menu from "./menu.svelte";
	import { Graph, Property, type Properties, type URI } from "./types";
	let container: HTMLElement;

	let graph: Graph;
	let network: Network;

	let selected_node: URI;
	let properties: Property[];
	let menu_position = { x: 0, y: 0 };

	let last_click = { x: 0, y: 0 };

	onMount(() => {
		create_graph("http://www.wikidata.org/entity/Q84263196");
	});

	async function create_graph(starting_point: string) {
		graph = new Graph();

		await graph.load(starting_point);
		graph.update_data();

		const options: Options = {
			nodes: {
				color: "#6a7e9d",
				shape: "dot",
				font: {
					color: "white",
				},
				chosen: false,
			},
			edges: {
				font: {
					strokeWidth: 0,
					color: "white",
				},
				labelHighlightBold: false,
			},
			physics: {
				solver: "forceAtlas2Based",
				maxVelocity: 5,
				minVelocity: 0.08,
				barnesHut: {
					springLength: 175,
				},
				timestep: 0.4,
			},
		};
		network = new vis.Network(container, graph.data, options);

		network.on("click", show_related_menu);
		network.on("oncontext", show_menu);
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

	function show_menu(params: Click_Event) {
		params.event.preventDefault();
		console.log(event);
	}

	function show_related_menu(event: Click_Event) {
		if (network.getSelectedNodes().length > 0) {
			selected_node = event.nodes[0];
			menu_position = event.pointer.DOM;
			last_click = event.pointer.canvas;
			const canvas_position = container.getBoundingClientRect();
			menu_position.x += canvas_position.x;
			menu_position.y += canvas_position.y;

			properties = [];
			graph.get_properties(selected_node).then((result) => {
				properties = result;
			});
		} else {
			selected_node = "";
		}
	}

	async function property_clicked(event: CustomEvent<{ uri: URI; property: URI }>) {
		const uri = event.detail.uri;
		const property = event.detail.property;
		selected_node = "";

		await graph.load_data(uri, property, last_click);
	}
</script>

<div class="flex flex-col justify-center w-full h-full">
	<h1>KG Visualizer</h1>
	<div class="graph_container" bind:this={container} />
</div>
<Menu {menu_position} node={selected_node} {properties} on:property_clicked={property_clicked} />

<style>
	.graph_container {
		width: 100%;
		height: 100%;
	}
</style>
