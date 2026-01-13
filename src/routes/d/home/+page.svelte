<script lang="ts">
	//functions
	import { numParse } from "@cerebrusinc/qol";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { prettyDate, percentageHandler, mrMateSymbols, chunkArray } from "$lib/utils";
	import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyChart from "$lib/components/AnyChart";

	//types
	import type { PageProps } from "./$types";
	import type { GetPortfolioData, NFHelp, Types } from "$lib/types";

	let { data }: PageProps = $props();
</script>

<Head
	title="Home | SBZ Digital"
	ogTitle="Home"
	description="Take a look at neurally aided portfolio insights and much more!"
	ogDescription="Take a look at neurally aided portfolio insights and much more!"
/>

<div class="flex flex-row items-center justify-between">
	<h3>Hi <u>{data.names.split(" ")[0]}</u>!</h3>
	<p class="text-[0.9em] italic opacity-70">
		<span class="num"
			>{data.luseId}{data.isLocal ? "L" : "F"}{data.accountType.toLowerCase() === "institution"
				? "C"
				: "I"}</span
		><span class="mx-1">•</span>{toTitleCase(data.accountType)}
	</p>
</div>

<p class="mt-5 text-[0.8em] opacity-70">Current Portfolio Value</p>
<h1 class="num -mb-2">ZMW {numParse(data.pfolio.overall.toFixed(2))}</h1>

<p
	class={data.quickStats.pDelta > 0
		? "gren flex flex-row items-center"
		: data.quickStats.pDelta === 0
			? "flex flex-row items-center"
			: "rd flex flex-row items-center"}
>
	{#if data.quickStats.pDelta === 0 || Number.isNaN(data.quickStats.pDelta)}
		<Minus class="h-3 w-3" />
	{:else if data.quickStats.pDelta < 0}
		<TrendingDown class="h-3 w-3" />{:else}<TrendingUp class="h-3 w-3" />
	{/if}<span class="num ml-1 text-[0.9em]"
		>{numParse(
			percentageHandler(
				Number.isNaN(data.quickStats.pDelta)
					? 0
					: data.quickStats.pDelta / data.quickStats.overalInv,
			).replace("%", ""),
		)}%</span
	>
</p>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
	Please note that the above value includes all USD holdings converted at the <i>Bank of Zambia</i>
	average buy rate of <span class="num">{numParse(data.portfolio.fxUsd.buy.toFixed(2))}</span> on {prettyDate(
		data.portfolio.fxUsd.date,
	)}
</p>

<table class="summary-table mt-5 w-full">
	<thead>
		<tr>
			<th colspan="5"
				>Kwacha Holdings: <span>{numParse(data.pfolio.portfolioTotalZmw.toFixed(2))}</span></th
			>
		</tr>
		<tr>
			<th>Stock</th>
			<th>Price</th>
			<th>Qty</th>
			<th>Value</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.pfolio.portfolioZmw[0] as entry}
			<tr>
				<td class="text-center">{entry.symbol}</td>
				<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
				<td class="num text-center">{numParse(entry.volume)}</td>
				<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
				<td class="text-center"
					><span
						class={data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0
							? "gren"
							: data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0
								? "rd"
								: undefined}
						>{#if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
							<ArrowUp class="h-4 w-4" />
						{:else if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
							<ArrowDown class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}</span
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>
{#if !Number.isNaN(data.quickStats.pDelta)}
	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		You invested a total of <span class="num"
			>{numParse(data.quickStats.investmentValueZMW.toFixed(2))}</span
		>
		into your kwacha holdings. The above and below values are as at {prettyDate(
			data.portfolio.dmr[0].date,
		)}.
	</p>
{/if}

<table class="summary-table mt-5 w-full">
	<thead>
		<tr>
			<th colspan="5"
				>Dollar Holdings: <span class="num"
					>{numParse(data.pfolio.portfolioTotalUsd.toFixed(2))}</span
				></th
			>
		</tr>
		<tr>
			<th>Stock</th>
			<th>Price</th>
			<th>Qty</th>
			<th>Value</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.pfolio.portfolioUsd[0] as entry}
			<tr>
				<td class="text-center">{entry.symbol}</td>
				<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
				<td class="num text-center">{numParse(entry.volume)}</td>
				<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
				<td class="text-center"
					><span
						class={data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0
							? "gren"
							: data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0
								? "rd"
								: undefined}
						>{#if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
							<ArrowUp class="h-4 w-4" />
						{:else if data.portfolio.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
							<ArrowDown class="h-4 w-4" />
						{:else}
							<Minus class="h-4 w-4" />
						{/if}</span
					></td
				>
			</tr>
		{/each}
	</tbody>
</table>
{#if !Number.isNaN(data.quickStats.pDelta)}
	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		You invested a total of <span class="num"
			>{numParse(data.quickStats.investmentValueUSD.toFixed(2))} (K {numParse(
				(data.quickStats.investmentValueUSD * data.portfolio.fxUsd.buy).toFixed(2),
			)})</span
		>
		into your dollar holdings. Your portfolio has an estimated kwacha value of
		<span class="num"
			>{numParse((data.pfolio["portfolioTotalUsd"] * data.portfolio.fxUsd.buy).toFixed(2))}</span
		>
		at a <i>Bank of Zambia</i> average sell rate of
		<span class="num">{numParse(data.portfolio.fxUsd.sell.toFixed(2))}</span>.
	</p>

	<p class="mt-5 text-[0.8em] opacity-70">Portfolio Analysis</p>

	<p class="text-justify text-[0.8em] opacity-90">
		{#each data["macroAnalysis"]["ytd"]["summary"] as txt}
			{#if txt.substring(0, 2) === "--"}
				<span class={txt.split("--")[1]}>{txt.replace(`--${txt.split("--")[1]}--`, "")}</span>
			{:else if txt.substring(0, 2) === "=="}
				<span class={txt.split("==")[1]}>{txt.replace(`==${txt.split("==")[1]}==`, "")}</span>
			{:else}
				{txt}
			{/if}
		{/each}
	</p>
	<AnyChart data={data.macroAnalysis.ytd.chart} tipo="RangeColumn" h={300} minifyY />

	<p class="mb-2 text-justify text-[0.8em] opacity-90">
		{#each data["macroAnalysis"]["perf"]["summary"] as txt}
			{#if txt.substring(0, 2) === "--"}
				<span class={txt.split("--")[1]}>{txt.replace(`--${txt.split("--")[1]}--`, "")}</span>
			{:else if txt.substring(0, 2) === "=="}
				<span class={txt.split("==")[1]}>{txt.replace(`==${txt.split("==")[1]}==`, "")}</span>
			{:else}
				{txt}
			{/if}
		{/each}
	</p>
	<AnyChart
		data={data.macroAnalysis.comp.stock.chart}
		tipo="TreeMapPercent"
		h={400}
		title="Portfolio Composition"
		isPercent
	/>

	<p class="mb-2 text-justify text-[0.8em] opacity-90">
		{#each data["macroAnalysis"]["comp"]["stock"]["summary"] as txt}
			{#if txt.substring(0, 2) === "--"}
				<span class={txt.split("--")[1]}>{txt.replace(`--${txt.split("--")[1]}--`, "")}</span>
			{:else if txt.substring(0, 2) === "=="}
				<span class={txt.split("==")[1]}>{txt.replace(`==${txt.split("==")[1]}==`, "")}</span>
			{:else}
				{txt}
			{/if}
		{/each}
	</p>
{/if}

{#if Number.isNaN(data.quickStats.pDelta)}
	<p class="mb-2 text-justify text-[0.8em] opacity-90">
		To begin, please use the menu button with a <span class="num">{'">"'}</span> on the left to read
		market data and begin submitting trades (soon).
	</p>
{/if}

<!--
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground underline">VS Market</p>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground underline">VS FX</p>
<p class="mt-2 text-justify text-[0.7em] text-muted-foreground underline">VS Inflation</p>
-->

<style lang="scss">
	h1 {
		font-size: 1.6em !important;
	}

	.summary-table {
		//border: 1px solid var(--shadow);

		th,
		td {
			padding: 5px 10px;
		}

		tbody tr:nth-child(odd) {
			background-color: var(--muted);
		}
	}

	@media screen and (max-width: 767px) {
		.holder {
			border-radius: 1px solid red;
		}

		.summary-table {
			&* {
				font-size: 0.8em;
			}
		}
	}
</style>
