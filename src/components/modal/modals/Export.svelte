<script lang="ts">
	import { copy_to_clipboard, dark_mode, show_toast } from '../../../util';
	import { CurrentGraph, type Node } from '../../../api/graph';
	import { Button } from 'flowbite-svelte';
	import { Settings } from '../../../settings';
	import { get } from 'svelte/store';
	import isUrl from 'is-url';
	import { SPARQL } from '../../../api/sparql';

	let image_src: string = '';

	// draw background and export canvas as image
	$: {
		$CurrentGraph;
		const canvas = $CurrentGraph.container.querySelector('canvas');
		if (canvas) {
			try {
				const background_canvas = document.createElement('canvas');
				background_canvas.width = canvas.width;
				background_canvas.height = canvas.height;
				const background_ctx = background_canvas.getContext('2d')!;
				background_ctx.fillStyle = dark_mode ? '#111827' : '#FFFFFF';
				background_ctx.fillRect(0, 0, canvas.width, canvas.height);
				background_ctx.drawImage(canvas, 0, 0);
				image_src = background_canvas.toDataURL('image/png', 1);
			} catch (e) {
				console.error(e);
			}
		}
	}

	function download() {
		const link = document.createElement('a');
		link.download = 'graph.png';
		link.href = image_src;
		link.click();
	}

	function export_sparql() {
		copy_to_clipboard(`
SELECT ?nodes
WHERE 
{
	VALUES ?nodes{
        ${$CurrentGraph.data.nodes
					.map((node: Node) => {
						if (isUrl(node.id)) return `${SPARQL.shorten_uri(node.id)}`;
						else
							return `"${node.id}"${
								node.datatype
									? '^^' + SPARQL.shorten_uri(node.datatype)
									: node.language
									? '@' + node.language
									: ''
							}`;
					})
					.join('\n')}
    }
}
        `);
	}
</script>

<h1 class="text-lg font-bold mb-2">Export</h1>
<div class="flex gap-2 sm:w-[450px] w-80 flex-col h-full">
	{#if image_src.length > 0}
		<img src={image_src} alt="graph" class="" />
	{:else}
		Could not export image because of iframe security :(
	{/if}

	<Button on:click={download}>Download Image</Button>
	<Button on:click={export_sparql}>Copy as Query</Button>
</div>
