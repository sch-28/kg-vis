<script lang="ts">
	import { onMount } from "svelte";
	import type { Network, Options } from "vis-network";
	import * as vis from "vis-network";
	import ContextMenu from "./components/Context-Menu.svelte";
	import Menu from "./components/Menu.svelte";
	import { Graph, Property, type URI, type Node } from "./graph";
	import toast, { Toaster } from "svelte-french-toast";

	let container: HTMLElement;

	let graph: Graph;
	let network: Network;

	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };

	let last_click = { x: 0, y: 0 };

	let progress = 0;

	let dark_mode = true;

	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;

	export let elem_id: string = "";
	export let visible: boolean = true;

	export let value: string;
	export let endpoint: string = "https://query.wikidata.org/sparql";
	export let rate_limit: number = 5;
	export let size_limit: number = 100;

	$: {
		endpoint, size_limit, rate_limit;
		if (value && value.length > 0) {
			create_graph(value);
		}
	}

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
		graph = new Graph(+rate_limit, +size_limit, endpoint);

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
		graph.set_network(network);

		network.on("click", show_properties);
		network.on("oncontext", show_context_menu);
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
			if (!node || node.type === "literal") return;

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

	async function property_clicked(
		event: CustomEvent<{ uri: URI; property: Property }>
	) {
		const uri = event.detail.uri;
		const property = event.detail.property;
		selected_node = undefined;
		const data_promise = graph.load_data(uri, property, last_click);
		toast.promise(
			data_promise,
			{
				loading: "Loading...",
				success: "Loaded!",
				error: "Error!"
			},
			{
				position: "bottom-center",
				style: `${
					dark_mode
						? "background: #1f2937; color: #fff"
						: "background: #fff; color: #000"
				}`
			}
		);
	}

	function set_progress(new_progress: number) {
		progress = new_progress;
	}
</script>

<div id={elem_id} hidden={!visible} class="relative">
	<Toaster />
	<div class="flex flex-col justify-center w-full container">
		<div class="graph_container" bind:this={container} />
	</div>
	<Menu
		{menu_position}
		{selected_node}
		on:property_clicked={property_clicked}
		{progress}
	/>
	<ContextMenu
		{menu_position}
		bind:hidden={hide_context_menu}
		selection={context_selection}
		{graph}
	/>
</div>

<style>
	.graph_container {
		width: 100%;
		height: 100%;
	}

	.container {
		height: 65vh;
	}
</style>
