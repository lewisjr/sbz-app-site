<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import {
		mrMateNumMinifier,
		percentageHandler,
		prettyDate,
		dateTimeifier,
		dmbKeysCodex,
	} from "$lib/utils";
	import { numParse } from "@cerebrusinc/qol";
	import { randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ApexOptions } from "$lib/types";
	import type { NFHelp } from "$lib/types";

	interface Props {
		stockData: NFHelp["StockData"][];
		key: NFHelp["DmbRowKey"];
		symbol: string;
	}

	let { key, stockData, symbol }: Props = $props();

	let options = $derived.by(() => {
		if (stockData.length > 0) {
			const _data: number[] = [];
			const _dates: number[] = [];
			const _codex: NFHelp["StockData"][] = [];

			const data: NFHelp["StockData"][] = JSON.parse(JSON.stringify(stockData));

			data.sort((a, b) => a.date - b.date);

			// keep the first prices to find an accurate delta
			data.map((d) => {
				if (d.symbol === symbol) {
					_data.push(d[key]);
					_dates.push(d.date);
					_codex.push(d);
				}
			});

			const obj: ApexOptions = {
				series: [
					{
						name: symbol,
						data: _data,
						color: randomColour(),
					},
				],
				chart: {
					type: "area",
					height: 550,
					width: "100%",
					zoom: {
						enabled: false,
					},
					toolbar: {
						show: false,
					},
				},
				dataLabels: {
					enabled: false,
				},
				stroke: {
					curve: "smooth",
				},
				labels: _dates.map((d) => dateTimeifier(d)),
				yaxis: {
					labels: {
						formatter: (val, ops) => {
							const minifyWhitelist: NFHelp["DmbRowKey"][] = [
								"turnover",
								"traded_vol",
								"market_cap",
							];

							const percentWhitelist: NFHelp["DmbRowKey"][] = ["delta"];

							const twoDecWhitelist: NFHelp["DmbRowKey"][] = ["delta_abs", "market_price"];

							if (minifyWhitelist.includes(key)) return mrMateNumMinifier(val);
							else if (percentWhitelist.includes(key)) return percentageHandler(val);
							else if (twoDecWhitelist.includes(key)) return val.toFixed(2);
							else return val.toString();
						},
						style: {
							fontWeight: 800,
							colors: mode.current === "dark" ? "#8a8a8a" : "black",
						},
					},
				},
				xaxis: {
					labels: {
						style: {
							fontWeight: 800,
							colors: mode.current === "dark" ? "#8a8a8a" : "black",
						},
					},
					type: "datetime",
				},
				tooltip: {
					theme: mode.current || "dark",
					custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
						return `<div class="px-4 py-2 flex flex-col items-center">
								<span>
									<strong>${prettyDate(_codex[dataPointIndex].date)}</strong>
								</span>
								<span>
									${symbol} @ K ${_codex[dataPointIndex].market_price.toFixed(2)}
								</span>
								<span>
									<strong>Market Cap: </strong>K ${numParse(_codex[dataPointIndex].market_cap.toFixed(2))}
								</span>
								<span>
									<strong>Bid: </strong>${_codex[dataPointIndex].bid.toFixed(2)} | <strong>Bid Vol: </strong>${numParse(_codex[dataPointIndex].bid_vol)}
								</span>
								<span>
									<strong>Ask: </strong>${_codex[dataPointIndex].ask.toFixed(2)} | <strong>Ask Vol: </strong>${numParse(_codex[dataPointIndex].ask_vol)}
								</span>
								<span>
									<strong>Volume: </strong>${numParse(_codex[dataPointIndex].traded_vol)} | <strong>Turnover: </strong>K ${numParse(_codex[dataPointIndex].turnover.toFixed(2))}
								</span>
								<span>
									<strong>Delta: </strong>K ${_codex[dataPointIndex].delta_abs} | <strong>% Delta: </strong>${percentageHandler(_codex[dataPointIndex].delta)}
								</span>
							</div>`;
					},
				},
			};

			return obj;
		}
	});
</script>

<div use:chart={options}></div>

<style lang="scss">
</style>
