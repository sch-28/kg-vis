<script lang="ts">
	import { dark_mode } from '../../../util';
	import type { Graph } from '../../../api/graph';
	import { Button } from 'flowbite-svelte';

	export let graph: Graph;

	let image_src: string = '';

	$: {
		graph;
		const canvas = graph.container.querySelector('canvas');
		if (canvas) {
			const destinationCanvas = document.createElement('canvas');
			destinationCanvas.width = canvas.width;
			destinationCanvas.height = canvas.height;

			const destCtx = destinationCanvas.getContext('2d')!;

			//create a rectangle with the desired color
			destCtx.fillStyle = dark_mode ? '#111827' : '#FFFFFF';
			destCtx.fillRect(0, 0, canvas.width, canvas.height);

			//draw the original canvas onto the destination canvas
			destCtx.drawImage(canvas, 0, 0);

			//finally use the destinationCanvas.toDataURL() method to get the desired output;
			image_src = destinationCanvas.toDataURL('image/png', 1);
		}
	}

	function download() {
		const link = document.createElement('a');
		link.download = 'graph.png';
		link.href = image_src;
		link.click();
	}
</script>

<h1 class="text-lg font-bold mb-2">Export</h1>
<div class="flex gap-2 w-[475px] flex-col h-full">
	<img src={image_src} alt="graph" class="" />

	<Button on:click={download}>Download Image</Button>
</div>
