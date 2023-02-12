import { Settings } from '../settings';
import { DataSet, DataView } from 'vis-data';
import type { Network, Options } from 'vis-network';
import { SPARQL } from './sparql';
import { get, writable } from 'svelte/store';
import isUrl from 'is-url';
import { blend_colors, dark_mode } from '../util';
import * as vis from 'vis-network';
import { LoaderManager } from '../components/loader/graph-loader';

const get_network_options = () => ({
	interaction: {
		hideEdgesOnDrag: get(Settings).hide_edges_on_drag ?? false
	},
	nodes: {
		color: {
			background: dark_mode ? '#6a7e9d' : '#74a0e9',
			border: dark_mode ? '#4a5e7d' : '#578ee9',
			highlight: {
				background: dark_mode ? '#F3F9FF' : '#82D47C',
				border: dark_mode ? '#4191F9' : '#00A58A'
			}
		},
		shape: 'dot',
		font: {
			color: dark_mode ? 'white' : 'black'
		},
		borderWidth: 3,
		chosen: {
			node: true,
			label: false
		},
		shapeProperties: {
			interpolation: false
		},
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
			highlight: dark_mode ? '#4191F9' : '#00A58A'
		},
		smooth: {
			type: get(Settings).smooth_edges ? 'dynamic' : 'continuous'
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
		stabilization: {
			enabled: true,
			iterations: 500
		},
		enabled: false
	}
});

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
export class Node implements vis.Node {
	id: URI;
	label: string;
	description: string;
	visible: boolean;
	temp_visible: boolean;
	is_fetched: boolean;
	fixed: boolean;
	image: string | undefined;
	type: 'uri' | 'literal';
	datatype?: string;
	language?: string;
	x: number;
	y: number;
	properties: Property[] = [];
	color?: ReturnType<typeof get_network_options>['nodes']['color'];
	borderWidth: number;
	borderWidthSelected: number;

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
		this.temp_visible = true;
		this.is_fetched = false;
		this.type = type;
		this.x = position.x;
		this.y = position.y;
		this.fixed = fixed;
		this.description = description;
		this.borderWidth = 4;
		this.borderWidthSelected = 4;
		if (image) {
			this.update_image(image);
		} else if (type === 'literal') {
			this.shape = 'hexagon' as any; // no idea why hexagon is not in the type
		}
	}

	update_image(url: URI) {
		this.image = url;
		this.shape = 'circularImage';
		this.borderWidth = 8;
		this.borderWidthSelected = 8;
	}
}

export class Edge {
	from: URI;
	uri: URI;
	to: URI;
	label: string;
	hidden_label: string;
	color?: { color: string; highlight: string };
	arrows: {
		to: {
			enabled: boolean;
			type: 'arrow';
		};
		from: {
			enabled: boolean;
			type: 'arrow';
		};
	};

	constructor(source: URI, uri: URI, target: URI, label: string) {
		this.from = source;
		this.uri = uri;
		this.to = target;
		this.hidden_label = label;
		this.arrows = {
			to: {
				enabled: true,
				type: 'arrow'
			},
			from: {
				enabled: false,
				type: 'arrow'
			}
		};
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

export type NodeFilter = {
	node: Node;
	range: number;
	color: string;
	visible: boolean;
};

export class Graph {
	nodes: Node[];
	edges: Edge[];
	network: Network;
	data: { nodes: DataSet<Node>; edges: DataSet<any> };
	data_view: { nodes: DataView<Node>; edges: DataView<any> };
	container: HTMLElement;
	node_filters: NodeFilter[];
	selected_color = '#277af7';
	node_history: { nodes: Node[]; visible: boolean }[] = [];
	history_index = 0;

	constructor(container: HTMLElement, start?: URI) {
		this.container = container;
		this.nodes = [];
		this.edges = [];
		const data_nodes = new DataSet<Node>([]);
		const data_edges = new DataSet<any>([]);
		this.data = { nodes: data_nodes, edges: data_edges };

		const data_view_nodes = new DataView(data_nodes, { filter: (node) => this.node_filter(node) });
		const data_view_edges = new DataView(data_edges, { filter: (edge) => this.edge_filter(edge) });
		this.data_view = { nodes: data_view_nodes, edges: data_view_edges };

		this.node_filters = [];

		this.network = new vis.Network(
			container,
			{ nodes: data_view_nodes, edges: data_view_edges },
			get_network_options() as Options
		);

		if (start) {
			this.load_node(start).then(() => this.update_data());
		}
	}

	undo() {
		if (this.history_index > -1) {
			const step = this.node_history[this.history_index];
			const nodes = step.nodes;
			nodes.map((n) => (n.visible = !step.visible));
			this.update_data(true, true);
			this.history_index--;
		}
	}

	redo() {
		if (this.history_index < this.node_history.length) {
			if (this.history_index < this.node_history.length - 1) this.history_index++;
			const step = this.node_history[this.history_index];
			const nodes = step.nodes;
			nodes.map((n) => (n.visible = step.visible));
			this.update_data(true, true);
		}
	}

	prune(nodes: Node[]) {
		const delete_nodes = this.nodes.filter((n) => !nodes.includes(n));
		delete_nodes.map((n) => (n.visible = false));
		this.update_data();
	}

	add_filter(node: Node, range?: number, color?: string, visible?: boolean) {
		if (this.node_filters.find((f) => f.node.id == node.id)) return;
		if (!range) range = 2;
		if (!color) color = this.selected_color;
		if (!visible) visible = true;

		this.node_filters.push({ node, range, color, visible });
		this.refresh_filters();
	}

	remove_filter(node: Node) {
		this.node_filters = this.node_filters.filter((f) => f.node.id != node.id);
		this.refresh_filters();
	}

	get_filter_nodes(filter: NodeFilter) {
		let connected_nodes: Node[] = [filter.node];

		let connected_node_ids = [filter.node.id];

		for (let i = 1; i < filter.range; i++) {
			connected_node_ids = connected_node_ids.flatMap((id) =>
				(this.network.getConnectedNodes(id) as string[]).filter((id) => typeof id === 'string')
			);
			connected_nodes = connected_nodes.concat(
				connected_node_ids
					.map((id) => this.nodes.find((n) => n.id === id))
					.filter((n) => n !== undefined) as Node[]
			);
		}

		connected_nodes = connected_nodes.filter(
			(n1, i, nodes) => nodes.findIndex((n2) => n2.id === n1.id) === i
		);
		return connected_nodes;
	}

	refresh_filters() {
		const visible_nodes = this.nodes.filter((n) => n.visible);
		const visible_edges = this.edges.filter((edge) => this.is_edge_visible(edge));
		for (const node of visible_nodes) {
			node.color = get_network_options().nodes.color;
			node.temp_visible = true;
		}
		for (const edge of visible_edges) {
			edge.color = get_network_options().edges.color;
		}

		for (const filter of this.node_filters) {
			const nodes = this.get_filter_nodes(filter);
			const node_ids = nodes.map((n) => n.id);
			for (const node of nodes) {
				if (node.color != get_network_options().nodes.color && node.color !== undefined) {
					node.color.background = blend_colors(node.color.background, filter.color, 0.5);
					node.color.border = blend_colors(node.color.border, filter.color, 0.5);
				} else if (node.color !== undefined) {
					node.color.background = filter.color;
					node.color.border = filter.color;
				}
				if (!filter.visible && node.temp_visible) {
					node.temp_visible = false;
					const pos = this.network.getPosition(node.id);
					node.x = pos.x;
					node.y = pos.y;
				} else {
					node.temp_visible = true;
				}
			}
			for (let i = 1; i < nodes.length; i++) {
				this.network.getConnectedEdges(nodes[i].id).forEach((edge_id) => {
					const data_edge = this.data.edges.get(edge_id);
					const edge =
						this.get_edge(data_edge.from, data_edge.uri, data_edge.to) ||
						this.get_edge(data_edge.to, data_edge.uri, data_edge.from);
					if (edge && node_ids.includes(edge.from) && node_ids.includes(edge.to)) {
						if (
							edge.color?.color != get_network_options().edges.color.color &&
							edge.color !== undefined
						) {
							edge.color = {
								color: blend_colors(edge.color.color, filter.color, 0.5),
								highlight: dark_mode ? '#4191F9' : '#00A58A'
							};
						} else {
							edge.color = {
								color: filter.color,
								highlight: dark_mode ? '#4191F9' : '#00A58A'
							};
						}
					}
				});
			}
		}

		this.refresh_nodes();
		this.refresh_edges();
		this.data_view.nodes.refresh();
		this.data_view.edges.refresh();
		this.network.redraw();
	}

	node_filter(node: Node) {
		return node.visible && node.temp_visible;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edge_filter(edge: Edge) {
		return true;
	}

	reset() {
		this.nodes = [];
		this.edges = [];
		this.node_filters = [];
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

	async update_data(visible = true, is_history = false) {
		if (!visible) return;
		LoaderManager.set_status('stabilizing', 0);
		LoaderManager.open();
		await new Promise((resolve) => setTimeout(resolve)); // wait for loader to open
		if (!this.network) return;

		const nodes = this.nodes.filter((node) => node.visible);
		const edges = this.edges.filter((edge) => this.is_edge_visible(edge));

		const old_nodes = this.data.nodes;
		const old_edges = this.data.edges;

		let new_nodes: Node[] = [];
		try {
			new_nodes = old_nodes.add(nodes).map((node) => {
				return nodes.find((n) => n.id == node) as Node;
			});
			old_edges.add(edges);
		} catch {
			// error in vis.js because of duplicate nodes - ignore
		}

		const deleted_nodes: Node[] = [];
		old_nodes.forEach((node: Node) => {
			if (!nodes.find((n) => n.id == node.id)) {
				deleted_nodes.push(node);
			}
		});

		const deleted_edges: Edge[] = [];
		old_edges.forEach((edge: Edge) => {
			if (!edges.find((e) => e.compare(edge))) {
				deleted_edges.push(edge);
			}
		});

		if (!is_history) {
			this.node_history = this.node_history.slice(0, this.history_index + 1);

			if (new_nodes.length > 0) {
				this.node_history.push({ nodes: new_nodes, visible: true });
				this.history_index = this.node_history.length - 1;
			}
			if (deleted_nodes.length > 0) {
				const local_deleted_nodes = deleted_nodes.map((node) => {
					return this.nodes.find((n) => n.id == node.id) as Node;
				});
				const positions = this.network.getPositions(local_deleted_nodes.map((node) => node.id));
				local_deleted_nodes.forEach((node) => {
					node.x = positions[node.id].x;
					node.y = positions[node.id].y;
				});
				this.node_history.push({ nodes: local_deleted_nodes, visible: false });
				this.history_index = this.node_history.length - 1;
			}
		}

		old_edges.remove(deleted_edges);
		old_nodes.remove(deleted_nodes);

		this.network?.stabilize();
		this.refresh_filters();

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

	show_nodes(nodes: Node[], update = true) {
		nodes.forEach((n) => (n.visible = true));
		update && this.update_data();
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
		this.refresh_nodes();
	}

	export_sparql(nodes: Node[]) {
		return `
	SELECT ?nodes
	WHERE 
	{
		VALUES ?nodes{
			${nodes
				.map((node: Node) => {
					if (isUrl(node.id)) return `${SPARQL.shorten_uri(node.id)}`;
					else
						return `"${node.id}"${
							node.datatype
								? '^^' + SPARQL.shorten_uri(node.datatype)
								: node.language
								? '@' + node.language
								: ''
						}`;
				})
				.join('\n')}
		}
	}
			`;
	}

	refresh_nodes() {
		const positions = this.network.getPositions();
		const nodes = this.nodes.filter((node) => node.visible);
		for (const node of nodes) {
			if (!node.temp_visible) {
				continue;
			}
			node.x = positions[node.id]?.x ?? node.x ?? 0;
			node.y = positions[node.id]?.y ?? node.y ?? 0;
		}
		this.data.nodes.update(nodes);
	}

	refresh_edges() {
		this.data.edges.update(this.edges);
	}

	get_edge(source: URI, uri: URI, target: URI) {
		return this.edges.find((edge) => edge.from == source && edge.uri == uri && edge.to == target);
	}

	create_edge(source: URI, uri: URI, target: URI, label: string) {
		const old_edge =
			this.edges.find((edge) => edge.from == source && edge.uri == uri && edge.to == target) ??
			this.edges.find((edge) => edge.from == target && edge.uri == uri && edge.to == source);

		if (old_edge) {
			old_edge.arrows.from.enabled = true;
			return true;
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

	async load_relations(new_nodes: Node[], visible: boolean = true) {
		LoaderManager.set_status('relations', 0);
		SPARQL.fetch_multiple_relations(
			new_nodes.map(SPARQL.convert_node_to_binding_content),
			this.nodes.map(SPARQL.convert_node_to_binding_content)
		).then((relations) => {
			LoaderManager.set_status('relations', 100);
			let update = false;
			for (const relation of relations) {
				this.create_edge(
					relation.subject.value,
					relation.property.value,
					relation.object.value,
					relation.property_label
				);
				const node = this.nodes.find((n) => n.id == relation.subject.value);
				const node_property = node?.properties.find((p) => p.uri == relation.property.value);
				const related = this.nodes.find((n) => n.id == relation.object.value);
				if (node_property) {
					if (related) {
						if (node_property.related.find((node) => node.id == related.id) == undefined) {
							node_property.related.push(related);
							if (node?.visible && related.visible) update = true;
						}
					}
				} else if (!node_property && node) {
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
		LoaderManager.set_status('related', 0);
		const raw_new_nodes = (await SPARQL.fetch_related_nodes(uri, property.uri)).sort((a, b) =>
			a.label.localeCompare(b.label)
		);
		LoaderManager.set_status('related', 100);

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

		// fetch all interconnections
		if (get(Settings).fetch_related && fetch_related) {
			this.load_relations(new_nodes, visible);
		} else {
			this.update_data(visible);
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
const defaultElement = document.createElement('div');
defaultElement.setAttribute('default', 'true');

export const CurrentGraph = writable<Graph>(new Graph(defaultElement));
