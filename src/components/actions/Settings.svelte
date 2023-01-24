<script lang="ts">
	import { getContext } from 'svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import {
		Input,
		Label,
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Toggle
	} from 'flowbite-svelte';
	import GraphIcon from 'svelte-material-icons/GraphOutline.svelte';
	import { ArrowPath, CircleStack, QuestionMarkCircle } from '@steeze-ui/heroicons';
	import { Settings } from '../../settings';
	import type { Graph } from '../../api/graph';

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
</script>

<h1 class="text-lg font-bold mb-2">Settings</h1>
<div class="flex gap-4 w-[450px]">
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
							<Icon src={QuestionMarkCircle} class="w-6 h-6" />
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
					<Label for="rate_limit" class="mb-2">Rate limit</Label>
					<Input
						bind:value={$Settings.rate_limit}
						type="number"
						id="rate_limit"
						placeholder="5"
						required
					/>
				</div>
				<div>
					<Label for="size_limit" class="mb-2">Size limit</Label>
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
			<Toggle bind:checked={$Settings.fetch_image}>Show images</Toggle>
			<Toggle bind:checked={$Settings.fetch_related}>Fetch relations</Toggle>
			<Toggle bind:checked={$Settings.animations}>Animations</Toggle>
			<Toggle bind:checked={$Settings.hide_edges_on_drag}>Hide edges on drag</Toggle>
		{:else if selected_setting === 'documentation'}
			<!-- <DocumentationSettings /> -->
		{/if}
	</div>
</div>
