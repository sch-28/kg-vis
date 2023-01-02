<script lang="ts">
	import { ChevronDown, Link, Share, XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { getContext } from 'svelte';

	const test = getContext('action') as Function;

	let hide_advanced = false;
	let advanced_container: HTMLDivElement;
	let container_height: number = 250;

	function toggle_advanced() {
		if (hide_advanced) {
			hide_advanced = false;
			advanced_container.style.height = container_height + 'px';
			setTimeout(() => (advanced_container.style.height = 'fit-content'), 200);
		} else {
			container_height = advanced_container.clientHeight;
			advanced_container.style.height = container_height + 'px';
			setTimeout(() => (advanced_container.style.height = '0px'), 0);
			hide_advanced = true;
		}
	}
</script>

<div class="p-2 flex gap-2 flex-col w-[450px]">
	<h1 class="text-lg font-bold">Add Node(s)</h1>

	<button
		class="border-b border-dark-muted flex justify-center items-center text-light-muted pb-1 relative"
		on:click={toggle_advanced}
	>
		Advanced <Icon
			src={ChevronDown}
			class="w-5 h-5 absolute right-0 transition-all duration-200 {hide_advanced
				? 'rotate-0'
				: '-rotate-180'}"
		/>
	</button>

	<div
		bind:this={advanced_container}
		class="transition-all duration-200 overflow-hidden flex gap-2 flex-col"
	>
		<div class="flex items-center mt-2">
			<input
				checked
				id="checked-checkbox"
				type="checkbox"
				value=""
				class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<label
				for="checked-checkbox"
				class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Fetch relations</label
			>
		</div>

		<hr class="border-dark-muted my-2" />
		<div>
			<form>
				<div
					class="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
				>
					<div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
						<label for="sparql-query" class="block mb-2 text-sm font-medium">SPARQL Query</label>
						<textarea
							id="sparql-query"
							rows="4"
							class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
							placeholder={`#Cats\nSELECT ?cat\nWHERE\n{\n	?cat wdt:P31 wd:Q146.\n}`}
							required
						/>
					</div>
					<div class="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
						<button
							type="submit"
							class="inline-flex items-center py-2 px-4 text-xs font-semibold text-center text-white bg-primary rounded-lg"
						>
							Fetch data
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>

	<div class="flex gap-2 flex-col">
		<div>
			<label for="website" class="block mb-2 text-sm font-medium">Entity URL</label>
			<input
				type="url"
				id="website"
				class="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primring-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600  dark:focus:ring-primary dark:focus:border-primring-primary"
				placeholder="http://www.wikidata.org/entity/Q84263196"
				required
			/>
		</div>
		<div class="space-y-1 max-w-md list-disc list-inside">
			<div class="flex">
				<div class="w-1.5 h-1.5 bg-light rounded-full flex-shrink-0 place-self-center mr-2" />
				<div class="truncate flex-grow">
					<a href="#" class="text-sm text-primary leading-6"
						>https://www.wikidata.org/wiki/Q84263196</a
					>
				</div>

				<button class="ml-2 align-middle">
					<Icon src={XMark} class="w-4 h-4" />
				</button>
			</div>
			<div class="flex">
				<div class="w-1.5 h-1.5 bg-light rounded-full flex-shrink-0 place-self-center mr-2" />
				<div class="truncate flex-grow">
					<a href="#" class="text-sm text-primary leading-6"
						>https://www.wikidata.org/wiki/Q84263196</a
					>
				</div>

				<button class="ml-2 align-middle">
					<Icon src={XMark} class="w-4 h-4" />
				</button>
			</div>
			<div class="flex">
				<div class="w-1.5 h-1.5 bg-light rounded-full flex-shrink-0 place-self-center mr-2" />
				<div class="truncate flex-grow">
					<a href="#" class="text-sm text-primary leading-6"
						>https://www.wikidata.org/wiki/Q84263196</a
					>
				</div>

				<button class="ml-2 align-middle">
					<Icon src={XMark} class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
	<div class="flex gap-2">
		<button on:click={() => test()} class="p-2 bg-primary rounded-lg w-20 font-semibold text-sm"
			>Add</button
		>
		<button on:click={() => test()}>Cancel</button>
	</div>
</div>
