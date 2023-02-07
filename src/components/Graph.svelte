<script lang="ts">
	import ContextMenu from './Context-Menu.svelte';
	import PropertyMenu from './Property-Menu.svelte';
	import { Graph, type URI, type Node } from '../api/graph';
	import ActionMenu from './Header.svelte';
	import InformationMenu from './Information-Menu.svelte';
	import LoadingCircle from './util/Loading-Circle.svelte';
	import { Button, Popover } from 'flowbite-svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Play } from '@steeze-ui/heroicons';

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

	let container: HTMLElement;
	let graph: Graph;
	let selected_node: Node | undefined;
	let menu_position = { x: 0, y: 0 };
	let hide_context_menu = true;
	let context_selection: Node | undefined = undefined;
	let show_node_information: Node | undefined = undefined;
	let loading_properties: boolean = false;
	let loading_graph: boolean = false;

	$: if (container) {
		graph = new Graph(container);
		graph.network.on('click', show_properties);
		graph.network.on('oncontext', show_context_menu);
		graph.network.on('startStabilizing', () => {
			loading_graph = true;
		});
		graph.network.on('stabilized', () => {
			loading_graph = false;
		});
	}

	function show_context_menu(event: Click_Event) {
		event.event.preventDefault();
		selected_node = undefined;
		const uri = graph.network.getNodeAt(event.pointer.DOM) as URI;
		const node = graph.get_node(uri);
		node ? (context_selection = node) : (context_selection = undefined);
		hide_context_menu = false;
		menu_position = event.pointer.DOM;
	}

	function show_properties(event: Click_Event) {
		hide_context_menu = true;
		if (graph.network.getSelectedNodes().length > 0) {
			const uri = event.nodes[0];
			const node = graph.get_node(uri);
			if (!node || node.type === 'literal') return;

			selected_node = node;
			const node_position = graph.network.canvasToDOM(graph.network.getPosition(uri));
			menu_position = node_position;

			loading_properties = true;
			graph.get_properties(uri).then((node) => {
				if (hide_context_menu && selected_node === node) selected_node = node;
				loading_properties = false;
			});
		} else {
			selected_node = undefined;
		}
	}
</script>

<InformationMenu bind:node={show_node_information} {graph} />
<div bind:this={container} class="w-full h-full" />
<PropertyMenu
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

{#if loading_graph}
	<div class="absolute bottom-4 right-4 w-8 h-8 flex justify-center items-center">
		<LoadingCircle />
		<Popover class="w-44 text-sm font-normal [&>*:nth-child(2)]:p-0" title="Graph is stabilizing">
			<div class="flex flex-col items-start">
				<Button
					on:click={() => graph.network.stabilize()}
					color="light"
					btnClass="py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Skip animation</Button
				>
				<Button
					on:click={() => graph.network.stopSimulation()}
					color="light"
					btnClass="rounded-b-lg py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Stop</Button
				>
			</div>
		</Popover>
	</div>
{:else if graph && graph.data.nodes.length > 0}
	<div class="absolute bottom-4 right-4 w-8 h-8 flex justify-center items-center">
		<Icon src={Play} />
		<Popover class="w-44 text-sm font-normal [&>*:nth-child(2)]:p-0" title="Graph is resting">
			<div class="flex flex-col items-start">
				<Button
					on:click={() => graph.network.startSimulation()}
					color="light"
					btnClass="py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Start animation</Button
				>
				<Button
					on:click={() => graph.network.stabilize()}
					color="light"
					btnClass="rounded-b-lg py-2 px-3 w-full text-left dark:hover:bg-black/30 hover:bg-black/10"
					>Stabilize</Button
				>
			</div>
		</Popover>
	</div>
{/if}
