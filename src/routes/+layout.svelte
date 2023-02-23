<script>
	import '../app.css';
	import 'flowbite';
	import { page } from '$app/stores';
	import { change_theme } from '../util';
	const selected_theme = $page.url.searchParams.get('theme');
	if (selected_theme !== null) change_theme(selected_theme === 'dark');
</script>
<svelte:head>
	<title>KG Visualization</title>
</svelte:head>
<slot />
