<script lang="ts">
	import { HelpOutline } from '@steeze-ui/material-design-icons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Tooltip } from 'flowbite-svelte';

	import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		text: string;
	}

	export let text = 'Tooltip text';
</script>

<div {...$$restProps}>
	<Icon src={HelpOutline} class="w-5 h-5 dark:fill-light-muted fill-dark-muted" />
	<Tooltip
		style="auto"
		defaultClass="rounded-lg shadow-lg !border dark:!border-dark-bg max-w-md py-2 px-3 text-sm font-medium"
		>{text}</Tooltip
	>
</div>
