<script lang="ts">
	import { ExclamationCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Button } from 'flowbite-svelte';
	import { ModalManager } from '../modal-store';

	export let message: string = 'Are you sure you want to do this?';
	export let on_confirm: (() => void) | undefined = undefined;
	export let on_cancel: (() => void) | undefined = undefined;
</script>

<div class="text-center px-4 py-2 max-w-sm">
	<Icon
		src={ExclamationCircle}
		size="48"
		class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200"
	/>
	<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">{message}</h3>
	<Button
		color="red"
		class="mr-2"
		on:click={() => {
			ModalManager.close();
			on_confirm?.();
		}}>Yes, I'm sure</Button
	>
	<Button
		color="light"
		on:click={() => {
			ModalManager.close();
			on_cancel?.();
		}}>No, cancel</Button
	>
</div>
