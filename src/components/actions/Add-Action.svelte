<script lang="ts">
	import { ChevronDown, XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import isUrl from 'is-url';
	import { SPARQL } from '../../api/sparql';
	import type { Graph, Node, URI } from 'src/api/graph';
	import { getContext, onMount } from 'svelte';
	import LoadingCircle from '../Loading-Circle.svelte';
	import { Settings } from '../../settings';
	import { Button, Hr, Toggle } from 'flowbite-svelte';
	import { click_outside } from '../../util';

	export let graph: Graph;

	const close = getContext('close') as () => void;

	let advanced_container: HTMLDivElement;
	let container_height: number = 201;
	let error: string = '';
	let loading: boolean = false;

	let nodes: Node[] = [];

	let sparql_query_area: HTMLTextAreaElement;
	let sparql_query: string = '';

	function submit_query() {
		if (loading) return;
		loading = true;
		SPARQL.query(sparql_query)
			.then(async (results) => {
				loading = false;
				error = '';
				if (results.length === 0) {
					return;
				}
				nodes = await graph.load_nodes(
					results.flatMap((b) => Object.values(b).map((n) => n.value)),
					false
				);
			})
			.catch((e) => {
				loading = false;
				console.log(e.message);
				error = e.message;
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
		graph.nodes = graph.nodes.filter((n) => n !== node);
		nodes = nodes.filter((n) => n !== node);
	}

	async function add_nodes() {
		graph.show_nodes(nodes);
		graph.load_relations(nodes);

		close();
	}

	function handle_resize() {
		if (sparql_query_area) $Settings.advanced_settings_height = sparql_query_area.clientHeight;
	}

	onMount(() => {
		if ($Settings.advanced_settings) {
			if ($Settings.advanced_settings_height)
				sparql_query_area.style.height = $Settings.advanced_settings_height + 'px';
			advanced_container.style.height = 'fit-content';
			advanced_container.style.overflow = 'visible';
		}
	});

	$: sparql_query_area && new ResizeObserver(handle_resize).observe(sparql_query_area);

	// smart search

	type Suggestion = {
		label: string;
		type: string;
		uri: string;
		height?: number;
		suggestion_type: 'direct' | 'search';
	};

	let suggestions: Suggestion[] = [
		{
			label: 'test',
			type: 'wikidata',
			uri: 'https://www.wikidata.org/wiki/Q42',
			suggestion_type: 'direct'
		},
		{
			label: 'test2',
			type: 'wikidata',
			uri: 'https://www.wikidata.org/wiki/Q42',
			suggestion_type: 'direct'
		}
	];

	let show_suggestsions = false;

	let entity_url: string = '';
	let debouncer: NodeJS.Timeout;

	// debounce the entity input
	$: {
		suggestions = [];
		if (debouncer) clearTimeout(debouncer);
		debouncer = setTimeout(() => {
			smart_search(entity_url);
		}, 500);
	}

	async function smart_search(input: string) {
		if (!input || input.length === 0) return;

		let suggestion_promises: Promise<Suggestion[]> | undefined = undefined;
		const url_promises: Promise<Suggestion>[] = [];
		const urls: string[] = [];
		if (isUrl(input)) {
			urls.push(input);

			if (input.startsWith('https://')) {
				input = input.replace('https://', 'http://');
			}

			if ($Settings.endpoint_type === 'wikidata') {
				if (input.includes('/wiki/')) {
					if (input.includes('wiki/Property:')) {
						urls.push(input.replace('wiki/Property:', 'prop/direct/'));
					} else {
						urls.push(input.replace('/wiki/', '/entity/'));
					}
				}
			} else if ($Settings.endpoint_type === 'dbpedia') {
				if (input.includes('/page/')) {
					urls.push(input.replace('/page/', '/resource/'));
				}
			}
		} else {
			if ($Settings.endpoint_type === 'wikidata') {
				// regex that filters for QIDs e.g. Q123456
				const qid_regex = /Q\d+/g;
				const qids = input.match(qid_regex);
				if (qids) {
					urls.push(...qids.map((qid) => `http://www.wikidata.org/entity/${qid}`));
				}

				// regex that filters for PIDs e.g. P123456
				const pid_regex = /P\d+/g;
				const pids = input.match(pid_regex);
				if (pids) {
					urls.push(...pids.map((pid) => `http://www.wikidata.org/prop/direct/${pid}`));
				}
			} else if ($Settings.endpoint_type === 'dbpedia') {
				urls.push(`http://dbpedia.org/resource/${input}`);
			}

			suggestion_promises = SPARQL.fetch_entities(input).then((entities) =>
				entities.map((e) => ({
					label: e.label,
					type: e.type,
					uri: e.uri,
					suggestion_type: 'search'
				}))
			);
		}

		url_promises.push(
			...urls.map((u) => {
				u = u.replaceAll(' ', '_');
				return SPARQL.fetch_info(u).then(
					(i) => ({ label: i.label, type: i.type, uri: u, suggestion_type: 'direct' } as Suggestion)
				);
			})
		);

		show_suggestsions = true;
		loading = true;
		suggestions = [];
		const [suggestion, ...url] = await Promise.all([suggestion_promises, ...url_promises]);
		if (suggestion) {
			suggestions = [...suggestion.filter((s) => s.label.length > 0 && s.label !== s.uri)];
		}
		suggestions.push(...url.filter((s) => s.label.length > 0 && s.label !== s.uri));
		//filter duplicates based on url
		suggestions = suggestions.filter((s, i, a) => a.findIndex((t) => t.uri === s.uri) === i);
		console.log(suggestions);
		loading = false;
	}
</script>

<div class="flex flex-col w-[450px]">
	<h1 class="text-lg font-bold mb-2">Add Nodes</h1>

	<button
		class="flex justify-center items-center text-dark-muted dark:text-light-muted pb-1 relative"
		on:click={toggle_advanced}
	>
		Advanced <Icon
			src={ChevronDown}
			class="w-5 h-5 absolute right-0 transition-all duration-200 {!$Settings.advanced_settings
				? 'rotate-0'
				: '-rotate-180'}"
		/>
	</button>
	<Hr divClass="mb-2" />
	<div
		bind:this={advanced_container}
		class="h-0 overflow-hidden transition-all duration-200 flex gap-2 flex-col mb-2"
	>
		<div
			class="mt-2 w-full border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
		>
			<div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
				<label for="sparql-query" class="block mb-2 text-sm font-medium">SPARQL Query</label>
				<textarea
					data-gramm="false"
					on:resize={handle_resize}
					bind:this={sparql_query_area}
					bind:value={sparql_query}
					id="sparql-query"
					rows="4"
					class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-light dark:placeholder-gray-400"
					placeholder={`SELECT ?cat WHERE\n{\n	?cat wdt:P31 wd:Q146.\n}`}
					required
				/>
			</div>
			<div class="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
				<Button on:click={submit_query} type="submit" size="sm" disabled={sparql_query.length == 0}
					>Fetch</Button
				>
			</div>
		</div>
	</div>

	<div class="flex gap-2 flex-col mb-2">
		<div class="relative">
			<label for="entity_url" class="block mb-2 font-medium">Entity</label>
			<input
				on:click={() => {
					if (suggestions.length > 0) {
						show_suggestsions = true;
					}
				}}
				bind:value={entity_url}
				type="text"
				id="entity_url"
				class="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primring-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600  dark:focus:ring-primary dark:focus:border-primring-primary"
				placeholder="http://www.wikidata.org/entity/Q84263196"
				required
			/>
			<div
				use:click_outside
				on:click_outside={() => (show_suggestsions = false)}
				class="{show_suggestsions && suggestions.length > 0
					? 'opacity-100 mt-2'
					: 'opacity-0'} flex flex-col border shadow-lg rounded-lg dark:border-dark-muted dark:bg-dark-bg bg-white z-50 w-full divide-y overflow-hidden transition-all duration-200 h-0"
				style={`height: ${
					show_suggestsions ? suggestions.reduce((sum, s) => sum + (s.height ?? 0), 0) : 0
				}px`}
			>
				{#if suggestions.length > 0}
					{#each suggestions as suggestion}
						<button
							on:click={() => {
								show_suggestsions = false;
								fetch_url(suggestion.uri);
							}}
							bind:offsetHeight={suggestion.height}
							class="p-2 flex flex-col border-gray-200 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-black/30"
						>
							<span class="font-medium">{suggestion.label}</span>
							<span class="text-sm font-light">{suggestion.type}</span>
						</button>
					{/each}
				{:else if !loading}
					<div class="flex flex-col border-gray-200 dark:border-gray-700">
						<span>No suggestions</span>
					</div>
				{/if}
			</div>
			<div hidden={!loading} class="absolute right-2 top-[3.35rem] -translate-y-1/2 w-6 h-6">
				<LoadingCircle />
			</div>
			{#if error && error.length > 0}
				<p class="mt-2 text-sm text-error dark:text-error-dark">
					<span class="font-medium">{error}</span>
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
	<Hr divClass="mb-2" />
	<div class="mb-2">
		<Toggle checked={$Settings.fetch_related}>Fetch relations</Toggle>
	</div>
	<div class="flex gap-2 items-center">
		<Button on:click={add_nodes} disabled={loading || nodes.length === 0} size="sm">Add</Button>
		<button on:click={close}>Cancel</button>
	</div>
</div>
