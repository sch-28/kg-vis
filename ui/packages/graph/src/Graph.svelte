<script lang="ts">
	import { onMount } from "svelte";
	import type { Network, Options } from "vis-network";
	import * as vis from "vis-network";
	import Menu from "./Menu.svelte";
	import { Graph, Property, type Properties, type URI } from "./types";
	import { createEventDispatcher } from "svelte";

	let container: HTMLElement;

	let graph: Graph;
	let network: Network;

	let selected_node: URI;
	let properties: Property[];
	let menu_position = { x: 0, y: 0 };

	let last_click = { x: 0, y: 0 };

	let progress = 0;

	let dark_mode = true;

	export let elem_id: string = "";
	export let value: string;
	export let visible: boolean = true;

	const dispatch = createEventDispatcher<{ change: undefined }>();

	$: value, dispatch("change");

	$: {
		if (value.length > 0) {
			create_graph(value);
		}
	}

	/* onMount(() => {
		create_graph("http://www.wikidata.org/entity/Q42442324");
	}); */

	onMount(() => {
		dark_mode =
			document.querySelector(".gradio-container")?.classList.contains("dark") ??
			document
				.querySelector("gradio-app")
				?.shadowRoot?.querySelector(".gradio-container")
				?.classList.contains("dark") ??
			false;
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
					color: dark_mode ? "white" : "black"
				},
				chosen: false
			},
			edges: {
				font: {
					strokeWidth: 0,
					color: dark_mode ? "white" : "black",
					background: dark_mode ? "#0b0f19" : "white"
				},
				labelHighlightBold: false
			},
			physics: {
				solver: "forceAtlas2Based",
				maxVelocity: 25,
				minVelocity: 1.5,

				barnesHut: {
					springLength: 175
				},
				timestep: 0.5
			}
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
			progress = 0;
			selected_node = event.nodes[0];
			menu_position = event.pointer.DOM;
			last_click = event.pointer.canvas;
			/* const canvas_position = container.getBoundingClientRect();
			menu_position.x += canvas_position.x;
			menu_position.y += canvas_position.y; */

			properties = [];
			graph.get_properties(selected_node, set_progress).then((result) => {
				properties = result;
			});
		} else {
			selected_node = "";
		}
	}

	async function property_clicked(
		event: CustomEvent<{ uri: URI; property: Property }>
	) {
		const uri = event.detail.uri;
		const property = event.detail.property;
		selected_node = "";

		await graph.load_data(uri, property, last_click);
	}

	function set_progress(new_progress: number) {
		progress = new_progress;
	}
</script>

<div class="flex flex-col justify-center w-full container">
	<div class="graph_container" bind:this={container} />
</div>
<Menu
	{menu_position}
	node={selected_node}
	{properties}
	on:property_clicked={property_clicked}
	{progress}
/>

<style>
	.graph_container {
		width: 100%;
		height: 100%;
	}

	.container {
		height: 65vh;
	}
</style>
