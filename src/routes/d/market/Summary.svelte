<script lang="ts">
	//types
	import type { Snippet } from "svelte";

	interface Props {
		text: Snippet<[]>;
		chart: Snippet<[]>;
		flipped?: boolean;
		isMobile?: boolean;
	}

	let { text, chart, flipped, isMobile = $bindable() }: Props = $props();
</script>

{#if isMobile}
	<div class="summary">
		{#if !flipped}
			<div class="summary-chart">
				{@render chart?.()}
			</div>
		{/if}

		<div class="summary-text">
			{@render text?.()}
		</div>

		{#if flipped}
			<div class="summary-chart">
				{@render chart?.()}
			</div>
		{/if}
	</div>
{:else}
	<div class="summary">
		{#if !flipped}
			<div class="summary-chart">
				{@render chart?.()}
			</div>
		{/if}

		<div class="summary-text">
			{@render text?.()}
		</div>

		{#if flipped}
			<div class="summary-chart">
				{@render chart?.()}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.summary {
		margin-top: 12px;
		display: flex;
		flex-direction: row;

		background-color: var(--background);

		.summary-chart {
			width: calc(100% - 450px);
			flex: 1;
		}

		.summary-text {
			width: 450px;
		}

		@media screen and (max-width: 766px) {
			flex-direction: column;
			width: 100%;

			.summary-chart {
				width: 100%;
				display: flex;
				flex-direction: column;
				margin-top: -10px;
				margin-bottom: 10px;
			}

			.summary-text {
				width: 100%;
				margin-top: 10px;
			}
		}
	}
</style>
