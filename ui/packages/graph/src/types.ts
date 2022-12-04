import { DataSet } from "vis-data";
import { SPARQL } from "./api";

export type URI = string;

export type Properties = {
	[id: string]: { label: string; uri: string }[];
};

export class Property {
	label: string | undefined;
	uri: URI;
	in_count: number;
	out_count: number;

	constructor(uri: URI, in_count: number, out_count: number, label?: string) {
		this.label = label;
		this.uri = uri;
		this.in_count = in_count;
		this.out_count = out_count;
	}
}
export class Node {
	id: URI;
	label: string;
	visible: boolean;
	is_fetched: boolean;
	image: string | undefined;
	x: number;
	y: number;
	properties: Property[] = [];
	shape:
		| "dot"
		| "image"
		| "box"
		| "circularImage"
		| "database"
		| "ellipse"
		| "icon"
		| "text"
		| "triangle"
		| "triangleDown" = "dot";

	constructor(
		uri: URI,
		label: string,
		visible = false,
		image?: URI,
		position: { x: number; y: number } = { x: 0, y: 0 }
	) {
		this.id = uri;
		this.label = label;
		this.visible = visible;
		this.is_fetched = false;
		this.x = position.x;
		this.y = position.y;
		if (image) {
			this.image = image;
			this.shape = "circularImage";
		}
	}

	update_image(url: URI) {
		this.image = url;
		this.shape = "circularImage";
	}
}

export class Edge {
	from: URI;
	uri: URI;
	to: URI;
	label: string;

	constructor(source: URI, uri: URI, target: URI, label: string) {
		this.from = source;
		this.uri = uri;
		this.to = target;
		this.label = label;
	}
}

export class Graph {
	nodes: Node[];
	edges: Edge[];

	data: { nodes: DataSet<any>; edges: DataSet<any> };

	constructor(
		rate_limit = 5,
		size_limit = 100,
		endpoint = "https://query.wikidata.org/sparql"
	) {
		this.nodes = [];
		this.edges = [];
		const data_nodes = new DataSet([]);
		const data_edges = new DataSet([]);
		this.data = { nodes: data_nodes, edges: data_edges };

		SPARQL.set_endpoint(endpoint);
		SPARQL.set_rate_limit(rate_limit);
		SPARQL.set_size_limit(size_limit);

		this.update_data();
	}

	is_edge_visible(edge: Edge) {
		for (let node_one of this.nodes) {
			if (node_one.id == edge.from && node_one.visible) {
				for (let node_two of this.nodes) {
					if (
						node_two != node_one &&
						node_two.id == edge.to &&
						node_two.visible
					) {
						return true;
					}
				}
			}
		}

		return false;
	}

	update_data() {
		const nodes = this.nodes.filter((node) => node.visible);
		const edges = this.edges.filter((edge) => this.is_edge_visible(edge));

		const old_nodes = this.data.nodes;
		const old_edges = this.data.edges;

		for (let node of nodes) {
			try {
				old_nodes.add(node);
			} catch {
				//pass
			}
		}
		for (let edge of edges) {
			try {
				old_edges.add(edge);
			} catch {
				//pass
			}
		}

		const deleted_nodes: Node[] = [];
		old_nodes.forEach((node: Node) => {
			if (!nodes.includes(node)) {
				deleted_nodes.push(node);
			}
		});

		for (let node of deleted_nodes) {
			old_nodes.remove(node);
		}

		const deleted_edges: Edge[] = [];
		old_edges.forEach((edge: Edge) => {
			if (!edges.includes(edge)) {
				deleted_edges.push(edge);
			}
		});

		for (let edge of deleted_edges) {
			old_edges.remove(edge);
		}

		return this.data;
	}

	find_or_create_node(
		uri: URI,
		label: string,
		visible = false,
		image?: URI,
		position: {
			x: number;
			y: number;
		} = { x: 0, y: 0 }
	) {
		let node = this.nodes.find((node) => node.id == uri);
		if (!node) {
			node = new Node(uri, label, visible, image, position);
			this.nodes.push(node);
		}
		return node;
	}

	create_edge(source: URI, uri: URI, target: URI, label: string) {
		if (
			this.edges.find(
				(edge) =>
					(edge.from == source && edge.uri == uri && edge.to == target) ||
					(edge.to == source && edge.uri == uri && edge.from == target)
			)
		) {
			return false;
		}
		const edge = new Edge(source, uri, target, label);
		this.edges.push(edge);

		return true;
	}

	async load_properties(uri: URI, progress_function?: Function) {
		const properties = await SPARQL.fetch_properties(uri, progress_function);
		if (properties.length > 0) {
			const node = this.find_or_create_node(uri, uri, true);
			node.is_fetched = true;
			node.properties = properties;
		}
	}

	async load(uri: URI) {
		const label = await SPARQL.fetch_label(uri);
		const image = await SPARQL.fetch_image(uri);
		this.find_or_create_node(uri, label, true, image);
	}

	async get_properties(uri: URI, progress_function?: Function) {
		const node = this.find_or_create_node(uri, "", true);
		if (!node.is_fetched) {
			await this.load_properties(node.id, progress_function);
		}

		return node;
	}

	async load_data(
		uri: string,
		property: Property,
		position: {
			x: number;
			y: number;
		} = { x: 0, y: 0 }
	) {
		const new_nodes = await SPARQL.fetch_data(
			uri,
			property.uri,
			this.nodes.map((n) => n.id)
		);

		for (let new_node of new_nodes) {
			const node = this.find_or_create_node(
				new_node.uri,
				new_node.label,
				true,
				undefined,
				position
			);
			node.x = position.x;
			node.y = position.y;
			node.visible = true;

			if (new_node.relations.length == 0) {
				this.create_edge(
					uri,
					property.uri,
					new_node.uri,
					property.label ?? "label"
				);
			} else {
				for (let relation of new_node.relations) {
					this.create_edge(
						relation.subject.value,
						relation.property.value,
						relation.object.value,
						relation.propLabel.value
					);
				}
			}
			this.update_data();
		}
		
		SPARQL.fetch_images(this.nodes.map((n) => n.id)).then((images) => {
			for (let image of images) {
				const node = this.nodes.find((n) => n.id == image.uri);
				if (node) {
					node.update_image(image.image);
					this.data.nodes.update(node);
				}
			}
		});
	}
}
