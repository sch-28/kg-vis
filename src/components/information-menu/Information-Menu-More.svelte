<script lang="ts">
	import { Badge, Hr } from 'flowbite-svelte';
	import type { Graph, Node, Property } from '../../api/graph';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ArrowTopRightOnSquare, Plus } from '@steeze-ui/heroicons';
	import { getContext } from 'svelte';

	export let property: Property;
	export let graph: Graph;
	const close = getContext('close') as () => void;

	function add_node(node: Node) {
		graph.show_node(node);
		close();
	}
</script>

{#if property}
	<div class="flex items-center">
		<h1 class="text-lg font-bold truncate">
			{property.label}
		</h1>
		<Badge rounded baseClass="ml-2">{property.related?.length ?? 0}</Badge>
	</div>
	<Hr divClass="my-2" />
	<div class="max-h-96 w-[500px] overflow-y-auto flex flex-col gap-1">
		{#each property.related ?? [] as node}
			<div
				class="flex gap-2 items-center px-2 rounded-lg min-h-[35px] group hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
			>
				<div class="truncate w-10/12" title={node.label}>
					{node.label}
				</div>
				<div
					class="w-2/12 group-hover:opacity-100 flex opacity-0 items-center justify-end pr-4 transition-all duration-200 ease-in-out"
				>
					<button
						class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
					>
						<Icon src={ArrowTopRightOnSquare} size={'20'} />
					</button>
					<button
						class="p-1 rounded-lg bg-transparent hover:bg-black/5 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
						on:click={() => add_node(node)}
					>
						<Icon src={Plus} size={'20'} />
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
