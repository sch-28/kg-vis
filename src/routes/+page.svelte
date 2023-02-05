<script>
	import { Settings } from '../settings';
	import Graph from '../components/Graph.svelte';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-french-toast';
	import Modal from '../components/modal/Modal.svelte';
	import { Modal_Manager } from '../components/modal/modal-store';

	onMount(() => {
		Modal_Manager.open;
	});
</script>

<Graph />
<Modal />
<Toaster />
