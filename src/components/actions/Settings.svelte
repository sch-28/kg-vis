<script lang="ts">
	import { getContext } from 'svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import {
		Input,
		Label,
		Select,
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Toggle
	} from 'flowbite-svelte';
	import GraphIcon from 'svelte-material-icons/GraphOutline.svelte';
	import { ArrowPath, CircleStack } from '@steeze-ui/heroicons';
	import { languages, Settings } from '../../settings';
	import type { Graph } from '../../api/graph';
	import Tooltip from '../Tooltip.svelte';
	import { HelpOutline } from '@steeze-ui/material-design-icons';

	const close = getContext('close') as () => void;
	export let graph: Graph;

	$: {
		graph.network?.setOptions({
			interaction: {
				hideEdgesOnDrag: $Settings.hide_edges_on_drag
			}
		});
	}

	let selected_setting: 'endpoint' | 'graph' | 'documentation' = 'endpoint';

	function update_labels() {
		graph.update_edge_labels();
	}

	const language_items = Object.keys(languages).map((lang) => {
		return {
			value: lang,
			name: languages[lang as keyof typeof languages]
		};
	});

	$: {
		$Settings.endpoint_url;
		if ($Settings.endpoint_url.includes('wikidata')) {
			$Settings.endpoint_type = 'wikidata';
		} else {
			$Settings.endpoint_type = 'dbpedia';
		}
	}
</script>

<h1 class="text-lg font-bold mb-2">Settings</h1>
<div class="flex gap-4 w-[475px] h-[230px]">
	<div>
		<Sidebar asideClass="w-48">
			<SidebarWrapper divClass="">
				<SidebarGroup>
					<SidebarItem
						label="Endpoint"
						active={selected_setting === 'endpoint'}
						on:click={() => (selected_setting = 'endpoint')}
					>
						<svelte:fragment slot="icon">
							<Icon src={CircleStack} class="w-6 h-6" />
						</svelte:fragment>
					</SidebarItem>
					<SidebarItem
						label="Graph"
						active={selected_setting === 'graph'}
						on:click={() => (selected_setting = 'graph')}
					>
						<svelte:fragment slot="icon">
							<div class="w-6 h-6">
								<GraphIcon width="100%" height="100%" />
							</div>
						</svelte:fragment>
					</SidebarItem>
				</SidebarGroup>
				<SidebarGroup border>
					<SidebarItem
						label="Documentation"
						active={selected_setting === 'documentation'}
						on:click={() => (selected_setting = 'documentation')}
					>
						<svelte:fragment slot="icon">
							<Icon src={HelpOutline} class="w-6 h-6 fill-current" />
						</svelte:fragment>
					</SidebarItem>
					<SidebarItem
						label="Reset Graph"
						on:click={() => {
							graph.reset();
							close();
						}}
						spanClass="dark:text-error-dark text-error ml-3"
					>
						<svelte:fragment slot="icon">
							<Icon src={ArrowPath} class="w-6 h-6 text-error dark:text-error-dark" />
						</svelte:fragment>
					</SidebarItem>
				</SidebarGroup>
			</SidebarWrapper>
		</Sidebar>
	</div>
	<div class="flex flex-col gap-2 w-full">
		{#if selected_setting === 'endpoint'}
			<!-- <h1 class="text-lg font-bold mb-2">Endpoint Settings</h1> -->
			<div>
				<Label for="endpoint" class="mb-2">Endpoint URL</Label>
				<Input
					bind:value={$Settings.endpoint_url}
					type="text"
					id="endpoint"
					placeholder="https://skynet.coypu.org/wikidata/"
					required
				/>
			</div>
			<div class="flex gap-2">
				<div>
					<Label for="endpoint_type" class="mb-2">Endpoint type</Label>
					<Select
						items={[
							{
								value: 'wikidata',
								name: 'Wikidata'
							},
							{
								value: 'dbpedia',
								name: 'DBpedia'
							}
						]}
						bind:value={$Settings.endpoint_type}
						id="endpoint_type"
						required
					/>
				</div>
				<div>
					<Label for="endpoint_lang" class="mb-2">Endpoint language</Label>
					<Select
						items={language_items}
						bind:value={$Settings.endpoint_lang}
						id="endpoint_lang"
						required
					/>
				</div>
			</div>
			<div class="flex gap-2">
				<div>
					<Label for="rate_limit" class="mb-2 flex gap-2">
						Rate limit
						<Tooltip text="Rate limit for the endpoint. Delay in ms." />
					</Label>
					<Input
						bind:value={$Settings.rate_limit}
						type="number"
						id="rate_limit"
						placeholder="5"
						required
					/>
				</div>
				<div>
					<Label for="size_limit" class="mb-2 flex gap-2">
						Size limit
						<Tooltip
							text="The size controls the amount of relations that is fetched in each request."
						/>
					</Label>
					<Input
						bind:value={$Settings.size_limit}
						type="number"
						id="size_limit"
						placeholder="100"
						required
					/>
				</div>
			</div>
		{:else if selected_setting === 'graph'}
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.fetch_image}>Show images</Toggle>
				<Tooltip text="Should the graph fetch & display images of nodes" />
			</div>
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.fetch_related}>Fetch relations</Toggle>
				<Tooltip text="Should the graph fetch relations between nodes" />
			</div>
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.animations}>Animations</Toggle>
				<Tooltip text="The graph will try to stabilize directly" />
			</div>
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.hide_edge_labels} on:change={update_labels}
					>Hide edge labels</Toggle
				>
				<Tooltip text="Will disable edge labels" />
			</div>
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.hide_edges_on_drag}>Hide edges on drag</Toggle>
				<Tooltip
					text="Hide edge lables only when dragging the view - this drastically improves performance "
				/>
			</div>
			<div class="flex items-center justify-between gap-2">
				<Toggle bind:checked={$Settings.smart_search}>Smart search</Toggle>
				<Tooltip
					text="When enabled, the search will try to find the best match for your input, by using a free-text search query on the official wikidata/dpbeida endpoints."
				/>
			</div>
		{:else if selected_setting === 'documentation'}
			<!-- <DocumentationSettings /> -->
		{/if}
	</div>
</div>
