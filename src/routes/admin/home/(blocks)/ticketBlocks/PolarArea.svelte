<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ApexOptions } from "$lib/types";
	import type { RadarData } from "./types";

	interface Props {
		data: RadarData;
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		if (data) {
			let total: number = data.data.reduce((sum, val) => sum + val, 0);

			const obj: ApexOptions = {
				chart: {
					height: 300,
					type: "polarArea",
					toolbar: {
						show: false,
					},
				},
				series: data.data,
				labels: data.labels,
				colors: ["#f23645", "#42f58d"],
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
				title: {
					text: "WoW Query Stats",
					align: "center",
					style: {
						color: mode.current === "dark" ? "#eee" : "#000",
						fontSize: "12pt",
					},
					offsetY: 10,
				},
				dataLabels: {
					textAnchor: "middle",
					enabled: true,
					// @ts-ignore
					formatter: (_, opt) => {
						const { seriesIndex } = opt;

						const value = data.data[seriesIndex];
						const name = data.labels[seriesIndex];

						return [name, numParse(value), percentageHandler(value / total)];
					},
					style: {
						fontSize: "11pt",
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

			options = obj;
		}

		const obj: ApexOptions = {
			chart: {
				width: 1024,
				type: "polarArea",
			},
			series: [{ data: [] }],
		};

		return obj;
	});
</script>

{#if data}
	<div use:chart={options}></div>
{:else}
	<div class="flex h-full flex-col items-center justify-center">
		<h3>No Data.</h3>
	</div>
{/if}
