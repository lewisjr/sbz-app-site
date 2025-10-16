<script lang="ts">
	//functions
	import { mrMateNumMinifier, percentageHandler, mrMateSymbols } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";
	import type { ApexOptions, Types } from "$lib/types";

	type Folio = Types["Folio"];

	interface Props {
		symbols: string[];
		turnovers: number[];
		pfolio: Folio[];
	}

	let { symbols, turnovers, pfolio }: Props = $props();

	let options = $derived.by(() => {
		const total = turnovers.reduce((acc, val) => acc + val, 0);

		const obj: ApexOptions = {
			chart: {
				width: 780,
				type: "polarArea",
				toolbar: {
					show: false,
				},
			},
			series: turnovers,
			labels: symbols,
			stroke: {
				width: 1,
				colors: undefined,
			},
			yaxis: {
				show: false,
			},
			plotOptions: {
				polarArea: {
					rings: {
						strokeWidth: 0,
					},
					spokes: {
						strokeWidth: 0,
					},
				},
			},
			dataLabels: {
				textAnchor: "middle",
				enabled: true,
				// @ts-ignore
				formatter: (_, opt) => {
					const { symbol, value, volume } = pfolio[opt.seriesIndex];
					return [
						mrMateSymbols(symbol),
						mrMateNumMinifier(volume) + " shares",
						"K " + mrMateNumMinifier(value),
						percentageHandler(value / total),
					];
				},
			},
			tooltip: {
				enabled: false,
			},
			legend: {
				width: 0,
				height: 0,
				fontSize: "0px",
				markers: {
					customHTML: () => "",
				},
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>

<style lang="scss">
	div {
		width: 780px;
		height: fit-content;
		position: relative;
	}
</style>
