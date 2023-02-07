import { Settings } from '../settings';
import { DataSet } from 'vis-data';
import type { Network, Options } from 'vis-network';
import { SPARQL } from './sparql';
import { get } from 'svelte/store';
import isUrl from 'is-url';
import { dark_mode } from '../util';
import * as vis from 'vis-network';

const get_network_options = () =>
	({
		interaction: {
			hideEdgesOnDrag: get(Settings).hide_edges_on_drag ?? false
		},
		nodes: {
			color: dark_mode ? '#6a7e9d' : '#74a0e9',
			shape: 'dot',
			font: {
				color: dark_mode ? 'white' : 'black'
			},
			borderWidth: 3,
			chosen: false,
			widthConstraint: {
				maximum: 125
			}
		},
		edges: {
			arrows: {
				to: {
					enabled: true,
					type: 'arrow'
				}
			},
			widthConstraint: {
				maximum: 125
			},
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
	} as Options);

export type URI = string;

export type Properties = {
	[id: string]: { label: string; uri: string }[];
};

export class Property {
	label: string | undefined;
	uri: URI;
	in_count: number;
	out_count: number;
	related: Node[] = [];
	fetched: boolean;

	constructor(uri: URI, in_count: number, out_count: number, label?: string, related?: Node[]) {
		this.label = label;
		this.uri = uri;
		this.in_count = in_count;
		this.out_count = out_count;
		if (related) {
			this.related = related;
		}
		this.fetched = false;
	}
}
export class Node {
	id: URI;
	label: string;
	description: string;
	visible: boolean;
	is_fetched: boolean;
	fixed: boolean;
	image: string | undefined;
	type: 'uri' | 'literal';
	datatype?: string;
	language?: string;
	x: number;
	y: number;
	properties: Property[] = [];
	color: string | undefined;
	shape:
		| 'dot'
		| 'image'
		| 'box'
		| 'circularImage'
		| 'database'
		| 'ellipse'
		| 'icon'
		| 'text'
		| 'triangle'
		| 'triangleDown' = 'dot';

	constructor(
		uri: URI,
		label: string,
		type: 'uri' | 'literal' = 'uri',
		visible = false,
		image?: URI,
		position: { x: number; y: number } = { x: 0, y: 0 },
		fixed = false,
		description = ''
	) {
		this.id = uri;
		this.label = label;
		this.visible = visible;
		this.is_fetched = false;
		this.type = type;
		this.x = position.x;
		this.y = position.y;
		this.fixed = fixed;
		this.description = description;
		if (image) {
			this.update_image(image);
		} else if (type === 'literal') {
			this.color = '#31C48D';
		}
	}

	update_image(url: URI) {
		this.image = url;
		this.shape = 'circularImage';
		this.color = 'transparent';
	}
}

export class Edge {
	from: URI;
	uri: URI;
	to: URI;
	label: string;
	hidden_label: string;

	constructor(source: URI, uri: URI, target: URI, label: string) {
		this.from = source;
		this.uri = uri;
		this.to = target;
		this.hidden_label = label;
		if (!get(Settings).hide_edge_labels) {
			this.label = label;
		} else this.label = '';
	}

	compare(other: Edge) {
		if (this.from == other.from && this.to == other.to && this.uri == other.uri) {
			return true;
		} else {
			return false;
		}
	}
}

export class Graph {
	nodes: Node[];
	edges: Edge[];
	network: Network;
	data: { nodes: DataSet<any>; edges: DataSet<any> };
	container: HTMLElement;

	constructor(container: HTMLElement, start?: URI) {
		this.container = container;
		this.nodes = [];
		this.edges = [];
		const data_nodes = new DataSet([]);
		const data_edges = new DataSet([]);
		this.data = { nodes: data_nodes, edges: data_edges };
		this.update_data();
		this.network = new vis.Network(container, this.data, get_network_options());

		if (start) {
			this.load_node(start).then(() => this.update_data());
		}
	}

	reset() {
		this.nodes = [];
		this.edges = [];
		this.data.nodes.clear();
		this.data.edges.clear();
	}

	is_edge_visible(edge: Edge) {
		for (const node_one of this.nodes) {
			if (node_one.id == edge.from && node_one.visible) {
				for (const node_two of this.nodes) {
					if (node_two != node_one && node_two.id == edge.to && node_two.visible) {
						return true;
					}
				}
			}
		}

		return false;
	}

	update_data(visible = true) {
		if (!visible) return;

		const nodes = this.nodes.filter((node) => node.visible);
		const edges = this.edges.filter((edge) => this.is_edge_visible(edge));

		const old_nodes = this.data.nodes;
		const old_edges = this.data.edges;

		for (const node of nodes) {
			try {
				old_nodes.add(node);
			} catch {
				//pass
			}
		}
		for (const edge of edges) {
			try {
				old_edges.add(edge);
			} catch {
				//pass
			}
		}

		const deleted_nodes: Node[] = [];
		old_nodes.forEach((node: Node) => {
			if (!nodes.find((n) => n.id == node.id)) {
				deleted_nodes.push(node);
			}
		});

		for (const node of deleted_nodes) {
			old_nodes.remove(node);
		}

		const deleted_edges: Edge[] = [];
		old_edges.forEach((edge: Edge) => {
			if (!edges.find((e) => e.compare(edge))) {
				deleted_edges.push(edge);
			}
		});

		for (const edge of deleted_edges) {
			old_edges.remove(edge);
		}

		if (!get(Settings).animations && visible) {
			this.network?.stabilize();
		}

		return this.data;
	}

	find_or_create_node(
		uri: URI,
		label: string,
		type: 'uri' | 'literal' = 'uri',

		visible = false,
		image?: URI,
		position: {
			x: number;
			y: number;
		} = { x: 0, y: 0 },
		description: string = ''
	) {
		let node = this.nodes.find((node) => node.id == uri);
		if (!node) {
			node = new Node(uri, label, type, visible, image, position, false, description);
			this.nodes.push(node);
		} else {
			if (label !== uri && label.length > node.label.length) {
				node.label = label;
			}
			if (description.length > node.description.length) {
				node.description = description;
			}
		}
		return node;
	}

	get_node(uri: URI) {
		return this.nodes.find((node) => node.id == uri);
	}

	update_node(node: Node, position?: { x: number; y: number }) {
		if (position) {
			node.x = position.x;
			node.y = position.y;
		}
		this.data.nodes.update(node);
	}

	hide_node(node: Node) {
		node.visible = false;
		this.update_data();
	}

	show_node(node: Node) {
		node.visible = true;
		this.update_data();
	}

	show_nodes(nodes: Node[]) {
		nodes.forEach((n) => (n.visible = true));
		this.update_data();
	}

	toggle_node_lock(node: Node, position: { x: number; y: number }) {
		node.fixed = !node.fixed;
		this.update_node(node, position);
	}

	lock_node(node: Node, position: { x: number; y: number }, lock = true) {
		node.fixed = lock;
		this.update_node(node, position);
	}

	lock_all_nodes(lock = true) {
		this.nodes.forEach((node) => (node.fixed = lock));
		const positions = this.network.getPositions();
		for (const node of this.nodes) {
			node.x = positions[node.id].x;
			node.y = positions[node.id].y;
		}
		this.data.nodes.update(this.nodes);
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

	async load_properties(uri: URI) {
		const properties = await SPARQL.fetch_properties(uri);
		if (properties.length > 0) {
			const node = this.find_or_create_node(uri, uri);
			node.is_fetched = true;
			node.properties = properties;
		}
	}

	async load_node(uri: URI, visible: boolean = true) {
		if (!isUrl(uri)) {
			return this.find_or_create_node(uri, uri, 'literal', visible);
		}

		const info_promise = SPARQL.fetch_info(uri);
		let image_promise: Promise<string | undefined> = Promise.resolve(undefined);
		if (get(Settings).fetch_image) {
			image_promise = SPARQL.fetch_image(uri);
		}

		const [info, image] = await Promise.all([info_promise, image_promise]);
		return this.find_or_create_node(
			uri,
			info.label,
			'uri',
			visible,
			image,
			undefined,
			info.description
		);
	}

	async load_nodes(uris: URI[], visible: boolean = true) {
		const label_promises = SPARQL.fetch_labels(uris);
		let image_promises: Promise<{ image: string; uri: string }[]> = Promise.resolve([]);
		if (get(Settings).fetch_image) {
			image_promises = SPARQL.fetch_images(uris);
		}
		const [labels, images] = await Promise.all([label_promises, image_promises]);
		const new_nodes = [];
		for (const uri of uris) {
			const label = labels.find((label) => label.uri === uri)?.label ?? uri;
			const image = images.find((image) => image.uri === uri)?.image;
			const node = this.find_or_create_node(uri, label, 'uri', visible, image);
			new_nodes.push(node);
		}
		return new_nodes;
	}

	update_edge_labels() {
		const hide = get(Settings).hide_edge_labels;
		this.edges.forEach((edge) => {
			if (hide) edge.label = '​'; // zero-width space to hide the edges.. doesn't work otherwise
			else edge.label = edge.hidden_label;
		});
		this.data.edges.update(this.edges);
	}

	async get_properties(uri: URI) {
		const node = this.find_or_create_node(uri, '');
		if (!node.is_fetched) {
			await this.load_properties(node.id);
		}

		return node;
	}

	async load_relations(new_nodes: Node[], visible: boolean = true, notify: boolean = true) {
		SPARQL.fetch_multiple_relations(
			new_nodes.map(SPARQL.convert_node_to_binding_content),
			this.nodes.map(SPARQL.convert_node_to_binding_content),
			notify
		).then((relations) => {
			let update = false;
			for (const relation of relations) {
				this.create_edge(
					relation.subject.value,
					relation.property.value,
					relation.object.value,
					relation.property_label
				);
				const node = this.nodes.find((n) => n.id == relation.subject.value);
				const property = node?.properties.find((p) => p.uri == relation.property.value);
				const related = this.nodes.find((n) => n.id == relation.object.value);
				if (property) {
					if (related) {
						if (property.related.find((node) => node.id == related.id) == undefined) {
							property.related.push(related);
							if (node?.visible && related.visible) update = true;
						}
					}
				} else if (!property && node) {
					node.properties.push({
						uri: relation.property.value,
						label: relation.property_label,
						related: related ? [related] : [],
						in_count: 0,
						out_count: 1,
						fetched: false
					});
					if (node.visible && related?.visible) update = true;
				}
			}
			this.update_data(update || visible);
		});
	}

	async load_related_nodes(
		uri: string,
		property: Property,
		visible = true,
		position: {
			x: number;
			y: number;
		} = { x: 0, y: 0 },
		notify = true,
		fetch_related = true
	) {
		const node = this.find_or_create_node(uri, uri);
		let existing_property = node.properties.find((p) => p.uri == property.uri);
		if (existing_property?.fetched) {
			return existing_property.related;
		} else if (!existing_property) {
			node.properties.push(property);
			existing_property = property;
		}

		const raw_new_nodes = (await SPARQL.fetch_related_nodes(uri, property.uri, notify)).sort(
			(a, b) => a.label.localeCompare(b.label)
		);
		const new_nodes: Node[] = [];
		const already_exists: Node[] = [];

		for (const new_node of raw_new_nodes) {
			const n = this.find_or_create_node(
				new_node.uri,
				new_node.label,
				new_node.type,
				visible,
				undefined,
				position
			);
			n.datatype = new_node.datatype;
			n.language = new_node.language;
			if (!n.visible) {
				n.x = position.x;
				n.y = position.y;
				n.visible = visible;
				new_nodes.push(n);
			} else {
				already_exists.push(n);
			}

			this.create_edge(uri, property.uri, new_node.uri, property.label ?? 'label');
			if (existing_property.related.find((node) => node.id == n.id) == undefined) {
				existing_property.related.push(n);
			}
		}
		existing_property.fetched = true;
		this.update_data(visible);

		// fetch all interconnections
		if (get(Settings).fetch_related && fetch_related) {
			this.load_relations(new_nodes, visible, notify);
		}
		if (get(Settings).fetch_image) {
			SPARQL.fetch_images(new_nodes.map((n) => n.id)).then((images) => {
				for (const image of images) {
					const node = this.nodes.find((n) => n.id == image.uri);
					if (node) {
						node.update_image(image.image);
						if (node.visible) this.data.nodes.update(node);
					}
				}
			});
		}

		return new_nodes.concat(already_exists);
	}
}
