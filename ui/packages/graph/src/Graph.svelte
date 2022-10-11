<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";
	// import PropertySelect from "./ui/property_select.svelte";
	import { Graph, SimNode, type SimLink, type Triple } from "./types/rdf.types";
	import type { ForceLink } from "d3";

	import { createEventDispatcher } from "svelte";

	export let elem_id: string = "";
	export let value: string;
	export let visible: boolean = true;

	const dispatch = createEventDispatcher<{ change: undefined }>();

	$: value, dispatch("change"), create_graph();


	const graph = new Graph();
	let simulation: d3.Simulation<SimNode, SimLink>;
	let svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

	async function fetch_data(event: CustomEvent<any>) {
		const uri = event.detail.node;
		const property = event.detail.property;

		const result = await fetch(
			`/api/data/${encodeURIComponent(uri)}/${encodeURIComponent(property)}`
		);
		const result_json = await result.json();

		if (result.ok) {
			graph.add_triple(result_json);
			update_nodes();
			update_links();
			simulation.alpha(1).restart().tick();
		} else {
			throw new Error("Not Implemented");
		}
	}

	async function fetch_properties(uri: string) {
		const result = await fetch(`/api/properties/${encodeURIComponent(uri)}`);
		const data = (await result.json()) as Triple[];
		if (result.ok) {
			return data;
		} else {
			throw new Error("Not Implemented");
		}
	}

	let selected_properties: string[] = [];
	let selected_node = "";

	async function node_click(uri: string) {
		const node = graph.get_node(uri)!;

		const triples = await fetch_properties(uri);
		graph.add_triple(triples);

		selected_properties = node.property_labels;
		selected_node = uri;
	}

	function update_nodes() {
		simulation.nodes(graph.d3_nodes);
		const node_elements = svg
			.select(".nodes")
			.selectAll("g")
			//.data(simulation.nodes(), (datum, index) => datum.value)
			.data(simulation.nodes())
			.enter()
			.append("g")
			.attr("id", (d) => d.value)
			.on("click", (d, x) => node_click(x.value));

		// create nodes

		const circles = node_elements.append("circle").attr("r", 5).attr("fill", 1);

		// create node - labels
		const texts = node_elements
			.append("text")
			.text(function (d) {
				return d.value;
			})
			.attr("fill", "white")
			.attr("x", 6)
			.attr("y", 10);

		drag_handler(
			node_elements as unknown as d3.Selection<Element, unknown, any, any>
		);
	}

	function update_links() {
		const force = simulation.force("link") as ForceLink<SimNode, SimLink>;

		force.links(graph.d3_links);

		svg
			.select(".links")
			.selectAll("line")
			.data(graph.d3_links)
			.enter()
			.append("line")
			.attr("stroke-width", 1);
	}

	let drag_handler: d3.DragBehavior<Element, unknown, unknown>;

	function create_drag(sim: d3.Simulation<SimNode, SimLink>) {
		function dragstarted(event: any, d: any) {
			if (!event.active) sim.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(event: any, d: any) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragended(event: any, d: any) {
			if (!event.active) sim.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		return d3
			.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended);
	}

	function create_graph() {
		svg = d3.select("svg");

		// TODO. used to color the circles
		const color = d3.scaleOrdinal(d3.schemeCategory10);

		simulation = d3.forceSimulation<SimNode, SimLink>();
		simulation.nodes(graph.d3_nodes);
		simulation.on("tick", ticked);

		simulation
			.force(
				"link",
				d3.forceLink<SimNode, SimLink>(graph.d3_links).id((d) => d.value)
			)
			.force("charge", d3.forceManyBody())
			.force(
				"center",
				d3.forceCenter(+svg.attr("width") / 2, +svg.attr("height") / 2)
			)
			.force("bounds", boxingForce);

		function boxingForce() {
			const width = +svg.attr("width");
			const height = +svg.attr("height");

			for (let node of graph.d3_nodes) {
				if (node.x! < 0) node.x = 0;
				if (node.x! > width) node.x = width;

				if (node.y! < 0) node.y = 0;
				if (node.y! > height) node.y = height;
			}
		}

		// create nodes
		const nodes = svg
			.append("g")
			.attr("class", "nodes")
			.selectAll("g")
			.data(graph.d3_nodes)
			.enter()
			.append("g")
			.attr("id", (d) => d.value)
			.on("click", (d, x) => node_click(x.value));

		const circles = nodes.append("circle").attr("r", 5).attr("fill", 1);
		/* 

		// create node - rects
		const rects = nodes
			.append('rect')
			.attr('height', '30')
			.attr('width', '300')
			.attr('fill', 1)
			.on('click', (d, x) => node_click(x.value)); */

		// create node - labels
		const texts = nodes
			.append("text")
			.text(function (d) {
				return d.value;
			})
			.attr("fill", "white")
			.attr("x", 6)
			.attr("y", 10);

		// create links
		svg
			.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(graph.d3_links)
			.enter()
			.append("line")
			.attr("stroke-width", 1);

		// create link - labels
		const line_labels = svg
			.append("g")
			.attr("class", "link_text")
			.selectAll("line")
			.data(graph.d3_links)
			.enter()
			.append("text")
			.text("hi");

		drag_handler = create_drag(simulation);
		drag_handler(nodes as unknown as d3.Selection<Element, unknown, any, any>);

		function ticked() {
			if(svg.selectAll<d3.BaseType, SimNode>(".nodes g").size() == 0) return;
			/* line_labels.attr('transform', (d) => {
				return (
					'translate(' +
					(d.source.x! + (d.target.x! - d.source.x!) / 2) +
					',' +
					(d.source.y! + (d.target.y! - d.source.y!) / 2) +
					')'
				);
			}); */
			svg
				.selectAll<d3.BaseType, SimLink>(".links line")
				.attr("x1", (d) => (d.source as SimNode).x!)
				.attr("y1", (d) => (d.source as SimNode).y!)
				.attr("x2", (d) => (d.target as SimNode).x!)
				.attr("y2", (d) => (d.target as SimNode).y!);

			svg
				.selectAll<d3.BaseType, SimNode>(".nodes g")
				.attr("transform", function (d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
		}
	}

	let svg_element:SVGElement;

	/* $: {
		if (svg_element) {
			create_graph();
		}
	} */

/* 	onMount(async () => {
		console
	}); */
</script>

<main>
	<svg width="960" height="600" bind:this={svg_element} />
	<!-- 	<PropertySelect
		bind:properties={selected_properties}
		bind:node={selected_node}
		on:property_clicked={fetch_data}
	/> -->
</main>

<style>
	:global(.links line) {
		stroke: #999;
		stroke-opacity: 0.6;
	}

	:global(.nodes circle) {
		stroke: #fff;
		stroke-width: 1.5px;
	}

	:global(text) {
		font-family: sans-serif;
		font-size: 10px;
	}
</style>
