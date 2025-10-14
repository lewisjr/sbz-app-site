<script lang="ts">
	//types
	import type { Snippet } from "svelte";

	interface Props {
		text: Snippet<[]>;
		chart: Snippet<[]>;
		flipped?: boolean;
	}

	let { text, chart, flipped }: Props = $props();
</script>

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

<style lang="scss">
	.summary {
		margin-top: 12px;
		display: flex;
		flex-direction: row;

		.summary-chart {
			width: calc(100% - 450px);
			flex: 1;
		}

		.summary-text {
			width: 450px;
		}
	}
</style>
