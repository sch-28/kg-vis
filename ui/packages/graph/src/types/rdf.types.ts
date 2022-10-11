import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";

export interface Node {
	// termType: string;
	value: string;
}

export interface Triple {
	s: Node;
	p: Node;
	o: Node;
}

export interface rdf_data {
	source: Node;
	property: Node;
	target: Node;
	target_property: Node;
	target_target: Node;
}

export interface SimNode extends SimulationNodeDatum {
	value: string;
}

export class SimNode implements SimNode {
	value: string;

	constructor(uri: string) {
		this.value = uri;
	}
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
	value: string;
	target: SimNode | string;
	source: SimNode | string;
}

export class SimLink implements SimLink {
	value: string;
	target: SimNode | string;
	source: SimNode | string;

	constructor(uri: string, source: string | SimNode, target: string | SimNode) {
		this.value = uri;
		this.target = target;
		this.source = source;
	}
}

export class Graph_Node {
	value: string;
	properties: { [property: string]: string[] };

	constructor(uri: string) {
		this.value = uri;
		this.properties = {};
	}

	add_properties(properties: string[]) {
		for (let property of properties) {
			const dict_property = this.properties[property];
			if (!dict_property) {
				this.properties[property] = [];
			}
		}
	}

	get property_labels() {
		return Object.keys(this.properties);
	}
}

export class Graph {
	nodes: Graph_Node[];

	d3_nodes: SimNode[];
	d3_links: SimLink[];

	constructor() {
		//TODO DYNAMIC STARTING POINT
		this.nodes = [new Graph_Node("http://dbpedia.org/resource/COVID-19")];
		this.d3_links = [];
		this.d3_nodes = [];
		this.update_d3();
	}

	get_node(uri: string) {
		return this.nodes.find((n) => n.value == uri);
	}

	get_d3_node(uri: string) {
		return this.d3_nodes.find((n) => n.value == uri);
	}

	add_triple(triples: Triple[]) {
		for (let triple of triples) {
			const source = triple.s.value;
			const property = triple.p.value;
			const target = triple.o.value;
			let source_node = this.get_node(source);
			if (!source_node) {
				source_node = new Graph_Node(source);
				this.nodes.push(source_node);
			}

			let node_property = source_node.properties[property];
			if (!node_property) {
				node_property = source_node.properties[property] = [];
			}

			node_property.push(target);

			let target_node = this.get_node(target);
			if (!target_node) {
				target_node = new Graph_Node(target);
				this.nodes.push(target_node);
			}
		}
		this.update_d3();
	}

	update_d3() {
		//TODO REMOVE REMOVED LINKS
		this.d3_nodes = this.d3_nodes.filter((n) =>
			this.nodes.find((nn) => nn.value == n.value)
		);

		const new_nodes = this.nodes.filter(
			(n) => !this.d3_nodes.find((nn) => nn.value == n.value)
		);

		for (let node of new_nodes) {
			const new_node = new SimNode(node.value);
			new_node.x = 0;
			new_node.y = 0;
			new_node.vx = 0;
			new_node.vy = 0;

			this.d3_nodes.push(new_node);
		}

		for (let node of this.nodes) {
			for (let property of Object.keys(node.properties)) {
				for (let connection of node.properties[property]) {
					//TODO FIXME
					if (!this.get_d3_node(connection) || connection == "test") continue;

					const link = new SimLink(
						property,
						this.get_d3_node(node.value)!,
						this.get_d3_node(connection)!
					);
					if (
						this.d3_links.find(
							(l) => l.source == link.source && l.target == link.target
						)
					) {
					} else {
						this.d3_links.push(link);
					}
				}
			}
		}
	}
}
