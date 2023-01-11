<script lang="ts">
	import { ChevronDown, Link, Share, XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import isUrl from 'is-url';
	import { SPARQL } from '../../api/sparql';
	import type { Graph, Node, URI } from 'src/api/graph';
	import { getContext, onMount } from 'svelte';
	import LoadingCircle from '../Loading-Circle.svelte';
	import { add } from 'svelte-french-toast/core/store';
	import { Settings } from '../../settings';
	import ActionMenu from '../Action-Menu.svelte';

	export let graph: Graph;

	const close = getContext('close') as () => void;

	let advanced_container: HTMLDivElement;
	let container_height: number = 258;
	let error: string = '';
	let loading: boolean = false;

	let nodes: Node[] = [];

	let sparql_query: HTMLTextAreaElement;

	function submit_query() {
		if (loading) return;
		loading = true;
		SPARQL.query(sparql_query.value).then(async (results) => {
			loading = false;
			if (results.length === 0) {
				return;
			}
			nodes = await graph.load_nodes(
				results.flatMap((b) => Object.values(b).map((n) => n.value)),
				false
			);
		});
	}

	function show_advanced() {
		advanced_container.style.height = container_height + 'px';
		setTimeout(() => {
			advanced_container.style.height = 'fit-content';
			advanced_container.style.overflow = 'visible';
		}, 200);
	}

	function hide_advanced() {
		advanced_container.style.overflow = 'hidden';
		$Settings.advanced_settings_height = 0;
		container_height = advanced_container.clientHeight;
		advanced_container.style.height = container_height + 'px';
		setTimeout(() => (advanced_container.style.height = '0px'), 0);
	}

	function toggle_advanced() {
		if (!$Settings.advanced_settings) {
			$Settings.advanced_settings = true;
			show_advanced();
		} else {
			hide_advanced();
			$Settings.advanced_settings = false;
		}
	}

	function handle_paste(e: ClipboardEvent) {
		// paste is handled before the input value is updated, therefore we need to wait a bit
		setTimeout(() => {
			const url = (e.target as HTMLInputElement).value ?? e.clipboardData?.getData('text') ?? null;
			if (url) {
				fetch_url(url);
			}
		}, 0);
	}

	async function fetch_url(url: URI) {
		if (loading) return;
		if (!isUrl(url)) {
			error = 'Invalid URL';
			return;
		}
		if (nodes.find((node) => node.id === url)) {
			error = 'Node already exists';
			return;
		}
		error = '';
		loading = true;
		const node = await graph.load_node(url);
		/* if (label === url) {
			error = 'No label found';
			return;
		} */
		nodes.push(node);
		nodes = nodes;
		loading = false;
	}

	function remove_node(node: Node) {
		nodes = nodes.filter((n) => n !== node);
	}

	async function add_nodes() {
		graph.show_nodes(nodes);
		SPARQL.fetch_multiple_relations(
			nodes.map((n) => n.id),
			graph.nodes.map((n) => n.id)
		).then((relations) => {
			for (let relation of relations) {
				graph.create_edge(
					relation.subject.value,
					relation.property.value,
					relation.object.value,
					relation.propLabel.value
				);
			}
			graph.update_data();
		});

		close();
	}

	function handle_resize() {
		if (sparql_query) $Settings.advanced_settings_height = sparql_query.clientHeight;
	}

	onMount(() => {
		if ($Settings.advanced_settings) {
			if ($Settings.advanced_settings_height)
				sparql_query.style.height = $Settings.advanced_settings_height + 'px';
			advanced_container.style.height = 'fit-content';
			advanced_container.style.overflow = 'visible';
		}
	});

	$: sparql_query && new ResizeObserver(handle_resize).observe(sparql_query);
</script>

<div class="p-2 flex flex-col w-[450px]">
	<h1 class="text-lg font-bold mb-2">Add Node(s)</h1>

	<button
		class="border-b border-dark-muted flex justify-center items-center text-dark-muted dark:text-light-muted pb-1 relative"
		on:click={toggle_advanced}
	>
		Advanced <Icon
			src={ChevronDown}
			class="w-5 h-5 absolute right-0 transition-all duration-200 {!$Settings.advanced_settings
				? 'rotate-0'
				: '-rotate-180'}"
		/>
	</button>

	<div
		bind:this={advanced_container}
		class="h-0 overflow-hidden transition-all duration-200 flex gap-2 flex-col mb-2"
	>
		<div class="flex items-center mt-2">
			<input
				checked
				id="checked-checkbox"
				type="checkbox"
				value=""
				class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<label
				for="checked-checkbox"
				class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Fetch relations</label
			>
		</div>

		<hr class="border-dark-muted my-2" />
		<div>
			<div
				class="w-full border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
			>
				<div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
					<label for="sparql-query" class="block mb-2 text-sm font-medium">SPARQL Query</label>
					<textarea
						on:resize={handle_resize}
						bind:this={sparql_query}
						id="sparql-query"
						rows="4"
						class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-light dark:placeholder-gray-400"
						placeholder={`SELECT ?cat WHERE\n{\n	?cat wdt:P31 wd:Q146.\n}`}
						required
					/>
				</div>
				<div class="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
					<button
						on:click={submit_query}
						type="submit"
						class="inline-flex items-center py-2 px-4 text-xs font-semibold text-center text-white bg-primary rounded-lg"
					>
						Fetch data
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="flex gap-2 flex-col mb-2">
		<div class="relative">
			<label for="entity_url" class="block mb-2 text-sm font-medium">Entity URL</label>
			<input
				disabled={loading}
				on:paste={handle_paste}
				on:keypress={(e) => {
					if (e.key === 'Enter') {
						const url = e.currentTarget.value;
						if (url) {
							fetch_url(url);
						}
					}
				}}
				on:change={(e) => {
					const url = e.currentTarget.value;
					if (url) {
						fetch_url(url);
					}
				}}
				type="url"
				id="entity_url"
				class="{loading
					? 'cursor-not-allowed'
					: ''} bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primring-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600  dark:focus:ring-primary dark:focus:border-primring-primary"
				placeholder="http://www.wikidata.org/entity/Q84263196"
				required
			/>
			<div hidden={!loading} class="absolute right-2 top-[3.075rem] -translate-y-1/2 w-6 h-6">
				<LoadingCircle />
			</div>
			{#if error && error.length > 0}
				<p class="mt-2 text-sm text-error dark:text-error-dark">
					<span class="font-medium">Invalid URL</span>
				</p>
			{/if}
		</div>
		{#if nodes.length > 0}
			<div class="space-y-1 max-w-md max-h-40 overflow-auto">
				{#each nodes as node}
					<div class="flex">
						<div
							class="w-1.5 h-1.5 bg-dark-muted dark:bg-light rounded-full flex-shrink-0 place-self-center mr-2"
						/>
						<div class="truncate flex-grow">
							<a href={node.id} class="text-sm text-primary leading-6 pb-[2px]">{node.label}</a>
						</div>

						<button class="ml-2 align-middle" on:click={() => remove_node(node)}>
							<Icon src={XMark} class="w-4 h-4" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div class="flex gap-2">
		<button
			on:click={add_nodes}
			class="p-2 bg-primary rounded-lg w-20 font-semibold text-sm text-white">Add</button
		>
		<button on:click={close}>Cancel</button>
	</div>
</div>
