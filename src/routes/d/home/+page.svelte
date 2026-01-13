<script lang="ts">
	//functions
	import { numParse } from "@cerebrusinc/qol";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { prettyDate, percentageHandler } from "$lib/utils";
	import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";

	// stores
	import { portfolioCacheStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyChart from "$lib/components/AnyChart";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";
	import AnyPicker from "$lib/components/AnyPicker.svelte";

	//icons
	import { Settings } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponseWData, Types } from "$lib/types";

	type YTDFolio = Types["YTDFolio"];

	let { data }: PageProps = $props();

	let year = $state<number>(0);
	let years = $derived.by(() => {
		const _data: number[] = [];

		// @ts-ignore
		let _y = !year ? data.year + 1 : data.year + 1;

		for (let i = 0; i < 5; i++) {
			_y -= 1;
			if (_y > 2024) _data.push(_y);
		}

		// console.log({ _data });

		return _data;
	});

	const updatePortfolioCache = (_data: YTDFolio, _y: number) => {
		const _cache = JSON.parse(JSON.stringify($portfolioCacheStore)) as typeof $portfolioCacheStore;
		_cache[year.toString()] = _data;

		portfolioCacheStore.set(_cache);
	};

	const getFolio = async () => {
		toast.info("Fetching portfolio...");
		openTrigger = 0;

		try {
			const req = await fetch("/api/d/home", {
				method: "POST",
				body: JSON.stringify({ luseId: data.luseId, year, cfg: "ytd-folio" }),
			});

			const res: GenericResponseWData<YTDFolio | undefined> = await req.json();

			if (!res.data) {
				toast.error(res.message);
				// @ts-ignore
				year = data.year;
				return;
			}

			updatePortfolioCache(res.data, year);
		} catch (ex) {
			toast.error(String(ex));
		}
	};

	let openTrigger = $state<number>(0);

	// initisalise year
	$effect(() => {
		// @ts-ignore
		year = data.year;
	});

	// update cache on every new year choice
	$effect(() => {
		(async () => {
			// @ts-ignore
			if (!$portfolioCacheStore[year.toString()] && year !== data.year) {
				await getFolio();
			}
		})();
	});

	onMount(() => {
		const _data: YTDFolio = {
			macroAnalysis: data.macroAnalysis,
			pdata: data.pdata,
			portfolio: data.portfolio,
			quickStats: data.quickStats,
		};

		// @ts-ignore
		updatePortfolioCache(_data, data.year);
	});
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

{#if $portfolioCacheStore[year.toString()]}
	<button
		class="mt-5 flex flex-row items-baseline"
		style="padding: 0px;"
		onclick={() => (openTrigger = Date.now())}
	>
		<p class="m-0 p-0 text-[0.8em] opacity-70">Current Portfolio Value</p>
		<Settings class="-mb-10 ml-2 h-3 w-3" />
	</button>
	<h1 class="num -mb-2">
		ZMW {numParse($portfolioCacheStore[year.toString()].portfolio.overall.toFixed(2))}
	</h1>

	<p
		class={$portfolioCacheStore[year.toString()].quickStats.pDelta > 0
			? "gren flex flex-row items-center"
			: $portfolioCacheStore[year.toString()].quickStats.pDelta === 0
				? "flex flex-row items-center"
				: "rd flex flex-row items-center"}
	>
		{#if $portfolioCacheStore[year.toString()].quickStats.pDelta === 0 || Number.isNaN($portfolioCacheStore[year.toString()].quickStats.pDelta)}
			<Minus class="h-3 w-3" />
		{:else if $portfolioCacheStore[year.toString()].quickStats.pDelta < 0}
			<TrendingDown class="h-3 w-3" />{:else}<TrendingUp class="h-3 w-3" />
		{/if}<span class="num ml-1 text-[0.9em]"
			>{numParse(
				percentageHandler(
					Number.isNaN($portfolioCacheStore[year.toString()].quickStats.pDelta)
						? 0
						: $portfolioCacheStore[year.toString()].quickStats.pDelta /
								$portfolioCacheStore[year.toString()].quickStats.overalInv,
				).replace("%", ""),
			)}%</span
		>
	</p>
	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		Please note that the above value includes all USD holdings converted at the <i>Bank of Zambia</i
		>
		average buy rate of
		<span class="num"
			>{numParse($portfolioCacheStore[year.toString()].pdata.fxUsd.buy.toFixed(2))}</span
		>
		on {prettyDate($portfolioCacheStore[year.toString()].pdata.fxUsd.date)}
	</p>

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Kwacha Holdings: <span
						>{numParse(
							$portfolioCacheStore[year.toString()].portfolio.portfolioTotalZmw.toFixed(2),
						)}</span
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
			{#each $portfolioCacheStore[year.toString()].portfolio.portfolioZmw[0] as entry}
				<tr>
					<td class="text-center">{entry.symbol}</td>
					<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
					<td class="num text-center">{numParse(entry.volume)}</td>
					<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
					<td class="text-center"
						><span
							class={$portfolioCacheStore[year.toString()].pdata.dmr.filter(
								(item) => item.symbol === entry.symbol,
							)[0].delta > 0
								? "gren"
								: $portfolioCacheStore[year.toString()].pdata.dmr.filter(
											(item) => item.symbol === entry.symbol,
									  )[0].delta < 0
									? "rd"
									: undefined}
							>{#if $portfolioCacheStore[year.toString()].pdata.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
								<ArrowUp class="h-4 w-4" />
							{:else if $portfolioCacheStore[year.toString()].pdata.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
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
	{#if !Number.isNaN($portfolioCacheStore[year.toString()].quickStats.pDelta)}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			You invested a total of <span class="num"
				>{numParse(
					$portfolioCacheStore[year.toString()].quickStats.investmentValueZMW.toFixed(2),
				)}</span
			>
			into your kwacha holdings. The above and below values are as at {prettyDate(
				$portfolioCacheStore[year.toString()].pdata.dmr[0].date,
			)}.
		</p>
	{/if}

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Dollar Holdings: <span class="num"
						>{numParse(
							$portfolioCacheStore[year.toString()].portfolio.portfolioTotalUsd.toFixed(2),
						)}</span
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
			{#each $portfolioCacheStore[year.toString()].portfolio.portfolioUsd[0] as entry}
				<tr>
					<td class="text-center">{entry.symbol}</td>
					<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
					<td class="num text-center">{numParse(entry.volume)}</td>
					<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
					<td class="text-center"
						><span
							class={$portfolioCacheStore[year.toString()].pdata.dmr.filter(
								(item) => item.symbol === entry.symbol,
							)[0].delta > 0
								? "gren"
								: $portfolioCacheStore[year.toString()].pdata.dmr.filter(
											(item) => item.symbol === entry.symbol,
									  )[0].delta < 0
									? "rd"
									: undefined}
							>{#if $portfolioCacheStore[year.toString()].pdata.dmr.filter((item) => item.symbol === entry.symbol)[0].delta > 0}
								<ArrowUp class="h-4 w-4" />
							{:else if $portfolioCacheStore[year.toString()].pdata.dmr.filter((item) => item.symbol === entry.symbol)[0].delta < 0}
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
	{#if !Number.isNaN($portfolioCacheStore[year.toString()].quickStats.pDelta)}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			You invested a total of <span class="num"
				>{numParse($portfolioCacheStore[year.toString()].quickStats.investmentValueUSD.toFixed(2))} (K
				{numParse(
					(
						$portfolioCacheStore[year.toString()].quickStats.investmentValueUSD *
						$portfolioCacheStore[year.toString()].pdata.fxUsd.buy
					).toFixed(2),
				)})</span
			>
			into your dollar holdings. Your portfolio has an estimated kwacha value of
			<span class="num"
				>{numParse(
					(
						$portfolioCacheStore[year.toString()].portfolio["portfolioTotalUsd"] *
						$portfolioCacheStore[year.toString()].pdata.fxUsd.buy
					).toFixed(2),
				)}</span
			>
			at a <i>Bank of Zambia</i> average sell rate of
			<span class="num"
				>{numParse($portfolioCacheStore[year.toString()].pdata.fxUsd.sell.toFixed(2))}</span
			>.
		</p>

		<p class="mt-5 text-[0.8em] opacity-70">Portfolio Analysis</p>

		<p class="text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["ytd"]["summary"] as txt}
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
			data={$portfolioCacheStore[year.toString()].macroAnalysis.ytd.chart}
			tipo="RangeColumn"
			h={300}
			minifyY
		/>

		<p class="mb-2 text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["perf"]["summary"] as txt}
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
			data={$portfolioCacheStore[year.toString()].macroAnalysis.comp.stock.chart}
			tipo="TreeMapPercent"
			h={400}
			title="Portfolio Composition"
			isPercent
		/>

		<p class="mb-2 text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["comp"]["stock"]["summary"] as txt}
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

	{#if Number.isNaN($portfolioCacheStore[year.toString()].quickStats.pDelta)}
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

	<AnyDrawer {openTrigger} title="Portfolio Year">
		{#snippet main()}
			<p class="mb-5">
				Select a year below for which to review your portfolio's perfomance and other related
				analytics.
			</p>
			<AnyPicker
				data={years.map((y) => {
					return { label: y.toString(), value: y.toString() };
				})}
				value={year.toString()}
				handler={(v) => (year = Number(v))}
				pickerTitle="Analysis Year"
			/>
		{/snippet}
	</AnyDrawer>
{:else}
	<button class="mt-5 flex w-fit flex-row items-baseline" style="padding: 0px;">
		<p class="m-0 w-fit p-0 text-[0.8em] opacity-70">Current Portfolio Value</p>
		<Settings class="-mb-10 ml-2 h-3 w-3" />
	</button>
	<h1 class="num loading no-padding -mb-2 w-fit">ZMW 00000.00</h1>

	<p class="loading no-padding mt-3 flex w-fit flex-row items-center">
		<Minus class="h-3 w-3" />
		<span class="num ml-1 text-[0.9em]">{numParse(percentageHandler(0).replace("%", ""))}%</span>
	</p>
	<p class="loading no-padding mt-2 w-fit text-justify text-[0.7em] text-muted-foreground">
		Please note that the above value includes all USD holdings converted at the <i>Bank of Zambia</i
		>
		average buy rate of
		<span class="num">{numParse("00000.00")}</span>
		on 31 Dec 2026
	</p>

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Kwacha Holdings: <span class="loading no-padding w-fit">{numParse("00000.00")}</span></th
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
		<tbody> </tbody>
	</table>
	<p class="loading no-padding mt-2 w-fit text-justify text-[0.7em] text-muted-foreground">
		You invested a total of <span class="num">{numParse("00000.00")}</span>
		into your kwacha holdings. The above and below values are as at 31 Dec 2026.
	</p>

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Dollar Holdings: <span class="loading no-padding w-fit">{numParse("00000.00")}</span></th
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
		<tbody> </tbody>
	</table>
	<p class="loading no-padding mt-2 w-fit text-justify text-[0.7em] text-muted-foreground">
		You invested a total of <span class="num"
			>{numParse("00000.00")} (K
			{numParse("00000.00")})</span
		>
		into your dollar holdings. Your portfolio has an estimated kwacha value of
		<span class="num">{numParse("00000.00")}</span>
		at a <i>Bank of Zambia</i> average sell rate of
		<span class="num">{numParse("00000.00")}</span>.
	</p>

	<!--
		<p class="mt-5 text-[0.8em] opacity-70">Portfolio Analysis</p>

		<p class="text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["ytd"]["summary"] as txt}
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
			data={$portfolioCacheStore[year.toString()].macroAnalysis.ytd.chart}
			tipo="RangeColumn"
			h={300}
			minifyY
		/>

		<p class="mb-2 text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["perf"]["summary"] as txt}
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
			data={$portfolioCacheStore[year.toString()].macroAnalysis.comp.stock.chart}
			tipo="TreeMapPercent"
			h={400}
			title="Portfolio Composition"
			isPercent
		/>

		<p class="mb-2 text-justify text-[0.8em] opacity-90">
			{#each $portfolioCacheStore[year.toString()]["macroAnalysis"]["comp"]["stock"]["summary"] as txt}
				{#if txt.substring(0, 2) === "--"}
					<span class={txt.split("--")[1]}>{txt.replace(`--${txt.split("--")[1]}--`, "")}</span>
				{:else if txt.substring(0, 2) === "=="}
					<span class={txt.split("==")[1]}>{txt.replace(`==${txt.split("==")[1]}==`, "")}</span>
				{:else}
					{txt}
				{/if}
			{/each}
		</p>
		-->
{/if}

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
