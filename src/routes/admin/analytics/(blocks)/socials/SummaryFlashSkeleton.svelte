<script lang="ts">
	//functions
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";

	interface Props {
		platform: string;
	}

	let { platform }: Props = $props();
</script>

<p class="date loading"><strong>Date Range</strong><br />12 March 2025 - 20 April 2025</p>

<h4 class="loading">Impressions</h4>
<h3 class="loading">
	{numParse(2000)} • {percentageHandler(0.9999)}
</h3>

<h4 class="loading">Reactions</h4>
<h3 class="loading">
	{numParse(795)} • {percentageHandler(0.9999)}
</h3>

<h4 class="loading">Comments</h4>
<h3 class="loading">
	{numParse(76)} • {percentageHandler(0.9999)}
</h3>

{#if platform !== "YouTube"}
	<h4 class="loading">Link Clicks</h4>
	<h3 class="loading">
		{numParse(123)} • {percentageHandler(0.9999)}
	</h3>
{/if}

<h4 class="loading">Subscribers</h4>
<h3 class="loading">
	{numParse(43902)} • {percentageHandler(0.9999)}
</h3>

<h4 class="loading">Post Count</h4>
<h3 class="loading">
	{numParse(13)} • {percentageHandler(0.9999)}
</h3>

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
</style>
