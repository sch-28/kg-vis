<script lang="ts">
	import { CurrentGraph } from '../../../api/graph';
	import { SPARQL } from '../../../api/sparql';

	const attributes = (): { label: string; value: string | number }[] => [
		{
			label: 'Nodes',
			value: $CurrentGraph.data.nodes.length
		},
		{
			label: 'Edges',
			value: $CurrentGraph.data.edges.length
		},
		{
			label: 'Hidden Nodes',
			value: $CurrentGraph.nodes.length - $CurrentGraph.data.nodes.length
		},
		{
			label: 'Hidden Edges',
			value: $CurrentGraph.edges.length - $CurrentGraph.data.edges.length
		},
		{
			label: 'Query Count',
			value: SPARQL.query_count
		}
	];
</script>

<h1 class="text-lg font-bold mb-2">Graph Statistics</h1>
<div class="flex gap-4 w-[300px] h-[230px]">
	<div class="flex gap-2 flex-col">
		{#each attributes() as { label, value }}
			<div class="flex flex-col gap-2 ">
				<span class="text-sm text-gray-600 dark:text-gray-400">{label}</span>
				<span class="text-lg font-bold">{value}</span>
			</div>
		{/each}
	</div>
</div>
