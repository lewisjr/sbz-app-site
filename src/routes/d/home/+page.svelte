<script lang="ts">
	//functions
	import { numParse } from "@cerebrusinc/qol";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { prettyDate, percentageHandler, miniDate } from "$lib/utils";
	import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";
	import { invalidateAll } from "$app/navigation";

	// stores
	import { portfolioCacheStoreV2 } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyChart from "$lib/components/AnyChart";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";
	import AnyPicker from "$lib/components/AnyPicker.svelte";

	//icons
	import { RefreshCcw } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type {
		GenericResponseWData,
		PortfolioStandards,
		GenericResponse,
		Types,
	} from "$lib/types";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";

	type YTDFolio = PortfolioStandards["GenAnalysisV2Return"];

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
		const _cache = JSON.parse(
			JSON.stringify($portfolioCacheStoreV2),
		) as typeof $portfolioCacheStoreV2;
		_cache[year.toString()] = _data;

		portfolioCacheStoreV2.set(_cache);
	};

	let openTrigger = $state<number>(0);

	// initisalise year
	$effect(() => {
		year = data.year;
	});

	let loading = $state<boolean>(false);

	const requestUpdate = async () => {
		if (data.updateDisabled) {
			toast.error("Your update request is currently in the queue.");
			return;
		}

		loading = true;
		toast.info("Submitting your update request...");

		try {
			const req = await fetch("/api/d/home/v2", {
				method: "PUT",
				body: JSON.stringify({ cfg: "folio-update" }),
			});

			const { message, success }: GenericResponse = await req.json();

			loading = false;

			if (success) {
				toast.success(message);
				await invalidateAll();
				return;
			}

			toast.error(message);
		} catch (ex) {
			toast.error("Failed to submit your request, please try again in a few minutes.");
		}
	};

	/*
	// update cache on every new year choice
	$effect(() => {
		(async () => {
			// @ts-ignore
			if (!$portfolioCacheStore[year.toString()] && year !== data.year) {
				await getFolio();
			}
		})();
	});
    */

	onMount(() => {
		const _data: YTDFolio = {
			dmr: data.dmr,
			fxUsd: data.fxUsd,
			portfolio: data.portfolio,
			macroAnalysis: data.macroAnalysis,
			pOverall: data.pOverall,
			pUsd: data.pUsd,
			pZk: data.pZk,
			year: data.year,
			matched: data.matched,
			screen: data.screen,
			updateDisabled: data.updateDisabled,
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

{#if $portfolioCacheStoreV2[year.toString()]}
	<button
		class="mt-5 flex flex-row items-baseline"
		style="padding: 0px;"
		onclick={() => requestUpdate()}
	>
		<p class="m-0 p-0 text-[0.8em] opacity-70">Current Portfolio Value</p>
		{#if loading}
			<Spinner class="-mb-10 ml-2 h-3 w-3" />
		{:else}
			<RefreshCcw class="-mb-10 ml-2 h-3 w-3" />
		{/if}
	</button>
	<h1 class="num -mb-2">
		ZMW {numParse($portfolioCacheStoreV2[year.toString()].pOverall.toFixed(2))}
	</h1>

	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		Please note that the above value includes all USD holdings converted at the <i>Bank of Zambia</i
		>
		average buy rate of
		<span class="num">{numParse($portfolioCacheStoreV2[year.toString()].fxUsd.buy.toFixed(2))}</span
		>
		on {prettyDate($portfolioCacheStoreV2[year.toString()].fxUsd.date)}.
	</p>

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Kwacha Holdings: <span
						>{numParse($portfolioCacheStoreV2[year.toString()].pZk.toFixed(2))}</span
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
			{#each $portfolioCacheStoreV2[year.toString()].portfolio as entry}
				{#if !entry.symbol.includes("USD")}
					<tr>
						<td class="text-center">{entry.symbol}</td>
						<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
						<td class="num text-center">{numParse(entry.qty)}</td>
						<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
						<td class="text-center"
							><span class={entry.delta > 0 ? "gren" : entry.delta < 0 ? "rd" : undefined}
								>{#if entry.delta > 0}
									<ArrowUp class="h-4 w-4" />
								{:else if entry.delta < 0}
									<ArrowDown class="h-4 w-4" />
								{:else}
									<Minus class="h-4 w-4" />
								{/if}</span
							></td
						>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
	{#if !Number.isNaN($portfolioCacheStoreV2[year.toString()].fxUsd.date !== 20200101)}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			The above and below values are as at {prettyDate(
				$portfolioCacheStoreV2[year.toString()].dmr[0].date,
			)}; The USD value is roughly USD {numParse(
				(
					$portfolioCacheStoreV2[year.toString()].pZk /
					$portfolioCacheStoreV2[year.toString()].fxUsd.sell
				).toFixed(2),
			)}.
		</p>
	{/if}

	<table class="summary-table mt-5 w-full">
		<thead>
			<tr>
				<th colspan="5"
					>Dollar Holdings: <span class="num"
						>{numParse($portfolioCacheStoreV2[year.toString()].pUsd.toFixed(2))}</span
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
			{#each $portfolioCacheStoreV2[year.toString()].portfolio as entry}
				{#if entry.symbol.includes("USD")}
					<tr>
						<td class="text-center">{entry.symbol}</td>
						<td class="num text-center">{numParse(entry.price.toFixed(2))}</td>
						<td class="num text-center">{numParse(entry.qty)}</td>
						<td class="num text-center">{numParse(entry.value.toFixed(2))}</td>
						<td class="text-center"
							><span class={entry.delta > 0 ? "gren" : entry.delta < 0 ? "rd" : undefined}
								>{#if entry.delta > 0}
									<ArrowUp class="h-4 w-4" />
								{:else if entry.delta < 0}
									<ArrowDown class="h-4 w-4" />
								{:else}
									<Minus class="h-4 w-4" />
								{/if}</span
							></td
						>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
	{#if !Number.isNaN($portfolioCacheStoreV2[year.toString()].fxUsd.date)}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			Your portfolio has an estimated kwacha value of
			<span class="num"
				>{numParse(
					(
						$portfolioCacheStoreV2[year.toString()].pUsd *
						$portfolioCacheStoreV2[year.toString()].fxUsd.buy
					).toFixed(2),
				)}</span
			>
			at a <i>Bank of Zambia</i> average buy rate of
			<span class="num"
				>{numParse($portfolioCacheStoreV2[year.toString()].fxUsd.buy.toFixed(2))}</span
			>.
		</p>
	{/if}

	<p class="mt-5 -mb-5 text-[0.8em] opacity-70">Trade History</p>
	<div class="hisory-table">
		<table class="summary-table mt-5 w-full">
			<thead>
				<tr>
					<th></th>
					<th>Date</th>
					<th>Symbol</th>
					<th>Price</th>
					<th>Vol.</th>
					<th>Value</th>
				</tr>
			</thead>
			{#if $portfolioCacheStoreV2[year.toString()].matched.length}
				<tbody>
					{#each $portfolioCacheStoreV2[year.toString()].matched as entry}
						<tr>
							<td class="num text-center">{entry.trade_side === "buy" ? "B" : "S"}</td>
							<td class="text-center">{miniDate(entry.trade_date)}</td>
							<td class="text-center">{entry.symbol}</td>
							<td class="text-center">{numParse(entry.price.toFixed(2))}</td>
							<td class="num text-center">{numParse(entry.qty)}</td>
							<td class="num text-center">{numParse((entry.price * entry.qty).toFixed(2))}</td>
						</tr>
					{/each}
				</tbody>
			{:else}
				<tbody>
					<tr>
						<td>No trade history to show.</td>
					</tr>
				</tbody>
			{/if}
		</table>
	</div>
	{#if $portfolioCacheStoreV2[year.toString()].matched.length}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			Please note that the above table is scrollable, and that settlemet of trades takes <b>T+3</b> days
			from the match date (or date in the table above).
		</p>
	{/if}

	<p class="mt-5 -mb-5 text-[0.8em] opacity-70">Pending Orders</p>
	<div class="hisory-table">
		<table class="summary-table mt-5 w-full">
			<thead>
				<tr>
					<th></th>
					<th>Date</th>
					<th>Symbol</th>
					<th>Price</th>
					<th>Vol.</th>
					<th>Value</th>
				</tr>
			</thead>
			{#if $portfolioCacheStoreV2[year.toString()].screen.length}
				<tbody>
					{#each $portfolioCacheStoreV2[year.toString()].screen as entry}
						<tr>
							<td class="text-center">{miniDate(entry.date)}</td>
							<td class="text-center">{entry.symbol}</td>
							<td class="text-center">{numParse(entry.price.toFixed(2))}</td>
							<td class="num text-center">{numParse(entry.qty)}</td>
							<td class="num text-center">{numParse((entry.price * entry.qty).toFixed(2))}</td>
						</tr>
					{/each}
				</tbody>
			{:else}
				<tbody>
					<tr>
						<td colspan="6" class="text-center">No pending orders to show.</td>
					</tr>
				</tbody>
			{/if}
		</table>
	</div>
	{#if $portfolioCacheStoreV2[year.toString()].screen.length}
		<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
			Please note that the above table is scrollable.
		</p>
	{/if}

	<p class="mt-5 mb-2 text-[0.8em] opacity-70">Portfolio Composition</p>

	<AnyChart
		data={$portfolioCacheStoreV2[year.toString()].macroAnalysis.comp.stock.chart}
		tipo="TreeMapPercent"
		h={400}
		title="Portfolio Composition"
		isPercent
	/>

	<p class="mb-2 text-justify text-[0.8em] opacity-90">
		{#each $portfolioCacheStoreV2[year.toString()]["macroAnalysis"]["comp"]["stock"]["summary"] as txt}
			{#if txt.substring(0, 2) === "--"}
				<span class={txt.split("--")[1]}>{txt.replace(`--${txt.split("--")[1]}--`, "")}</span>
			{:else if txt.substring(0, 2) === "=="}
				<span class={txt.split("==")[1]}>{txt.replace(`==${txt.split("==")[1]}==`, "")}</span>
			{:else}
				{txt}
			{/if}
		{/each}
	</p>

	{#if !$portfolioCacheStoreV2[year.toString()].portfolio.length}
		<p class="mb-2 text-justify text-[0.8em] opacity-90">
			To begin, please use the menu button with a <span class="num">{'">"'}</span> on the left to read
			market data and begin submitting trades (soon).
		</p>
	{/if}
{:else}
	<button class="mt-5 flex w-fit flex-row items-baseline" style="padding: 0px;">
		<p class="m-0 w-fit p-0 text-[0.8em] opacity-70">Current Portfolio Value</p>
		<RefreshCcw class="-mb-10 ml-2 h-3 w-3" />
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

	.hisory-table {
		width: 100%;
		max-height: 300px;
		overflow-y: auto;
		position: relative;

		table {
			border-collapse: separate !important;
			border-spacing: 0 !important;
		}

		table thead th {
			position: sticky !important;
			top: 0 !important;
			z-index: 11 !important;
			background-color: var(--background) !important;
		}

		* {
			font-size: 9pt;
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
