<script lang="ts">
	import Modal from 'svelte-simple-modal';
	import { get } from 'svelte/store';
	import { ModalManager } from './modal-store';

	let content: any = null;

	ModalManager.store.subscribe((new_modal) => {
		content = new_modal;
	});
</script>

<Modal
	show={content}
	on:closed={() => ModalManager.close()}
	classBg="z-[51] fixed top-0 left-0 w-screen h-screen flex flex-col justify-center bg-gray-900 bg-opacity-50 dark:bg-opacity-80"
	classWindowWrap="relative m-2 max-h-full"
	classWindow="relative w-fit max-w-full max-h-full my-2 mx-auto bg-white dark:bg-dark-bg shadow-lg dark:border-dark-muted border rounded-lg "
	classContent="relative p-4 overflow-auto"
	unstyled
	closeButton={false}
	transitionBgProps={{ duration: 150 }}
/>
