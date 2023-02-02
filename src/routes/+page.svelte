<script>
	import { Settings } from '../settings';
	import Graph from '../components/Graph.svelte';
</script>

<Graph
	value={$Settings.endpoint_type === 'wikidata'
		? 'http://www.wikidata.org/entity/Q84263196'
		: 'http://dbpedia.org/resource/COVID-19'}
/>
