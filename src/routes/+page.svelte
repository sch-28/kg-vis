<script>
	import Graph from '../components/Graph.svelte';
</script>

<Graph
	rate_limit={20}
	endpoint="https://skynet.coypu.org/wikidata/"
	value="http://www.wikidata.org/entity/Q84263196"
/>
