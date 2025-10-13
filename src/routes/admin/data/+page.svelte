<script lang="ts">
	//functions
	import { workDayEngines } from "$lib/utils";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//types
	import type { NFdb, NFHelp } from "$lib/types";
	import type { PageData } from "./$types";

	let stockData = $state<NFHelp["StockData"][]>([]);
	let fxData = $state<NFHelp["FxData"][]>([]);
	let econData = $state<NFHelp["EconData"][]>([]);

	let globalSummarySetting = $state<"day" | "week">("day");

	let stockSummary = $derived.by(() => {
		if (stockData.length) {
			const df = stockData[0].date;

			let di = stockData[0].date;
		} else return undefined;
	});
</script>

<Head
	title="Market Data | SBZ Admin"
	ogTitle="Market Data"
	description="Take a look at neurally aided market data analysis."
	ogDescription="Take a look at neurally aided market data analysis."
/>

<h1>W.I.P</h1>

<style lang="scss">
</style>
