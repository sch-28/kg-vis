<script lang="ts">
	import LoadingCircle from '../util/Loading-Circle.svelte';
	import {
		LoaderManager,
		LoadingStates,
		LoadingStatesDescription,
		type Loader
	} from './graph-loader';

	let loader: Loader;
	LoaderManager.store.subscribe((new_loader) => {
		loader = new_loader;
		/* loader.loading = true;
		if (loader.loading) {
			loader.state = 'relations';
			loader.progress = 50;
		} */
	});
</script>

{#if loader && loader.visible && loader.state}
	<div
		class="z-[51] fixed top-0 left-0 w-screen h-screen flex flex-col justify-center bg-gray-900 bg-opacity-50 dark:bg-opacity-75"
	>
		<div class="relative m-2 max-h-full">
			<div class="relative w-fit max-w-full max-h-full my-2 mx-auto ">
				<div class="relative p-4 overflow-auto">
					<div class="flex flex-col items-center justify-center gap-2">
						<div
							class="w-12 h-12 [&_svg]:!fill-blue-500 [&_svg]:!text-gray-300 [&_svg]:dark:!text-dark-muted"
						>
							<LoadingCircle />
						</div>
						<div class="grid grid-cols-3 gap-2 w-80 items-center">
							{#each LoadingStates as state}
								<div
									class="h-2 bg-gray-300 dark:bg-dark-muted rounded-full overflow-hidden relative transition-all duration-300"
								>
									<div
										class="{state === loader.state
											? 'bg-blue-500 dark:bg-blue-500'
											: 'bg-blue-500 dark:bg-blue-900'} h-full transition-all duration-300"
										style="width: {loader.state === state && loader.progress
											? loader.progress
											: LoadingStates.indexOf(state) < LoadingStates.indexOf(loader.state)
											? 100
											: 0}%;"
									/>
								</div>
							{/each}
						</div>
						<div class="text-xl font-bold text-light ">
							{LoadingStatesDescription[loader.state]}...
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
