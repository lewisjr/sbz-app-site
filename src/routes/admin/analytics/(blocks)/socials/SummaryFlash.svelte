<script lang="ts">
	//functions
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";

	//types
	import type { SummaryData } from "../../types";

	interface Props {
		summaryData: SummaryData;
		platform: string;
		isRange: boolean;

		prevDate: string;
	}

	let { isRange, platform, prevDate, summaryData }: Props = $props();
</script>

<p class="date"><strong>Date Range</strong><br />{prevDate} - {summaryData.date}</p>

<h4>{summaryData.udf1Label}</h4>
{#if isRange && summaryData.udf1Delta}
	<h3>
		<span class={summaryData.udf1Delta > 0 ? "up" : summaryData.udf1Delta < 0 ? "down" : undefined}
			>{numParse(summaryData.udf1Volume)}</span
		>
		•
		<span class={summaryData.udf1Delta > 0 ? "up" : summaryData.udf1Delta < 0 ? "down" : undefined}
			>{percentageHandler(summaryData.udf1Delta)}</span
		>
	</h3>
{:else}
	<h3 class={summaryData.udf1Delta > 0 ? "up" : summaryData.udf1Delta < 0 ? "down" : undefined}>
		{numParse(summaryData.udf1Volume)}
	</h3>
{/if}

{#if platform !== "spotify"}
	<h4>{summaryData.udf2Label}</h4>
	{#if isRange && summaryData.udf2Delta}
		<h3>
			<span
				class={summaryData.udf2Delta > 0 ? "up" : summaryData.udf2Delta < 0 ? "down" : undefined}
				>{numParse(summaryData.udf2Volume)}</span
			>
			•
			<span
				class={summaryData.udf2Delta > 0 ? "up" : summaryData.udf2Delta < 0 ? "down" : undefined}
				>{percentageHandler(summaryData.udf2Delta)}</span
			>
		</h3>
	{:else}
		<h3 class={summaryData.udf2Delta > 0 ? "up" : summaryData.udf2Delta < 0 ? "down" : undefined}>
			{numParse(summaryData.udf2Volume)}
		</h3>
	{/if}
{/if}

{#if platform !== "spotify"}
	<h4>{summaryData.commentsLabel}</h4>
	{#if isRange && summaryData.commentsDelta}
		<h3>
			<span
				class={summaryData.commentsDelta > 0
					? "up"
					: summaryData.commentsDelta < 0
						? "down"
						: undefined}>{numParse(summaryData.commentsVolume)}</span
			>
			•
			<span
				class={summaryData.commentsDelta > 0
					? "up"
					: summaryData.commentsDelta < 0
						? "down"
						: undefined}>{percentageHandler(summaryData.commentsDelta)}</span
			>
		</h3>
	{:else}
		<h3
			class={summaryData.commentsDelta > 0
				? "up"
				: summaryData.commentsDelta < 0
					? "down"
					: undefined}
		>
			{numParse(summaryData.commentsVolume)}
		</h3>
	{/if}
{/if}

{#if platform !== "YouTube"}
	<h4>{summaryData.udf3Label}</h4>
	{#if isRange && summaryData.udf3Delta}
		<h3>
			<span
				class={summaryData.udf3Delta > 0 ? "up" : summaryData.udf3Delta < 0 ? "down" : undefined}
				>{numParse(summaryData.udf3Volume)}</span
			>
			•
			<span
				class={summaryData.udf3Delta > 0 ? "up" : summaryData.udf3Delta < 0 ? "down" : undefined}
				>{percentageHandler(summaryData.udf3Delta)}</span
			>
		</h3>
	{:else}
		<h3 class={summaryData.udf3Delta > 0 ? "up" : summaryData.udf3Delta < 0 ? "down" : undefined}>
			{numParse(summaryData.udf3Volume)}
		</h3>
	{/if}
{/if}

<h4>{summaryData.udf4Label}</h4>
{#if isRange && summaryData.udf4Delta}
	<h3>
		<span class={summaryData.udf4Delta > 0 ? "up" : summaryData.udf4Delta < 0 ? "down" : undefined}
			>{numParse(summaryData.udf4Volume)}</span
		>
		•
		<span class={summaryData.udf4Delta > 0 ? "up" : summaryData.udf4Delta < 0 ? "down" : undefined}
			>{percentageHandler(summaryData.udf4Delta)}</span
		>
	</h3>
{:else}
	<h3 class={summaryData.udf4Delta > 0 ? "up" : summaryData.udf4Delta < 0 ? "down" : undefined}>
		{numParse(summaryData.udf4Volume)}
	</h3>
{/if}

<h4>Post Count</h4>
{#if isRange && summaryData.countDelta}
	<h3>
		<span
			class={summaryData.countDelta > 0 ? "up" : summaryData.countDelta < 0 ? "down" : undefined}
			>{numParse(summaryData.countVolume)}</span
		>
		•
		<span
			class={summaryData.countDelta > 0 ? "up" : summaryData.countDelta < 0 ? "down" : undefined}
			>{percentageHandler(summaryData.countDelta)}</span
		>
	</h3>
{:else}
	<h3 class={summaryData.countDelta > 0 ? "up" : summaryData.countDelta < 0 ? "down" : undefined}>
		{numParse(summaryData.countVolume)}
	</h3>
{/if}

<style lang="scss">
	.date {
		margin-bottom: 20px;
		text-align: center;
		opacity: 0.6;
	}

	h4 {
		font-size: 15pt;
		opacity: 0.7;
	}

	h3 {
		margin-bottom: 10px;
	}

	.up {
		color: var(--kline-green);
	}

	.down {
		color: var(--kline-red);
	}
</style>
