<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ApexOptions } from "$lib/types";
	import type { HeatMapData } from "./types";
	import { formatDbTime, percentageHandler } from "$lib/utils";

	interface Props {
		data: HeatMapData[];
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		if (data.length) {
			const totalsCodex: { [key: string]: number } = {};

			const _data: HeatMapData[] = JSON.parse(JSON.stringify(data));

			_data.forEach((s) => {
				s.data.forEach((d) => {
					if (!totalsCodex[d.x]) totalsCodex[d.x] = d.y;
					else totalsCodex[d.x] = totalsCodex[d.x] + d.y;
				});
			});

			const obj: ApexOptions = {
				chart: {
					height: 400,
					type: "heatmap",
					toolbar: {
						show: false,
					},
					zoom: {
						enabled: false,
					},
					sparkline: {
						enabled: false,
					},
				},
				title: {
					text: "WoW Query Departments", //`Peak Query Time • ${_24to12(data.peakHour)}`,
					align: "center",
					style: {
						color: mode.current === "dark" ? "#eee" : "#000",
						fontSize: "12pt",
					},
					offsetY: 10,
				},

				series: data,
				plotOptions: {
					heatmap: {
						colorScale: {
							ranges: [
								{
									from: 0,
									to: 9,
									color: "#7397c9",
									name: "Low",
								},
								{
									from: 10,
									to: 18,
									color: "#73c995",
									name: "Medium",
								},
								{
									from: 19,
									to: 100,
									color: "#6b5a96",
									name: "High",
								},
							],
						},
					},
				},
				dataLabels: {
					//@ts-ignore
					formatter: (_, opts) => {
						const { dataPointIndex, seriesIndex, value } = opts;
						const { x } = data[seriesIndex].data[dataPointIndex];
						const total = totalsCodex[x];

						return [numParse(value), percentageHandler(value / total)];
					},
					dropShadow: {
						enabled: true,
						blur: 10,
					},
				},
				tooltip: {
					enabled: true,
					theme: mode.current === "dark" ? "dark" : "light",
					custom: ({ seriesIndex, dataPointIndex }) => {
						const { name, data: series } = data[seriesIndex];

						const { x, y } = series[dataPointIndex];

						return `<div class="px-4 py-2 flex flex-col items-center">
                                    <span>
                                        <strong>${formatDbTime(x).split(",")[0]}</strong>
                                    </span>
                                    <span>
                                        <strong>${numParse(y)}</strong> Queries
                                    </span>
                                </div>`;
					},
				},
				xaxis: {
					labels: {
						style: {
							fontSize: "8pt",
							fontWeight: 700,
							colors: [
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
								mode.current === "dark" ? "#eee" : "#000",
							],
						},
						show: true,
					},
					type: "datetime",
				},
				yaxis: {
					labels: {
						style: {
							fontSize: "10pt",
							fontWeight: 700,
							colors: [mode.current === "dark" ? "#eee" : "#000"],
						},
					},
				},
				legend: {
					labels: {
						colors: [
							mode.current === "dark" ? "#eee" : "#000",
							mode.current === "dark" ? "#eee" : "#000",
							mode.current === "dark" ? "#eee" : "#000",
						],
					},
				},
			};

			return obj;
		}

		const obj: ApexOptions = {
			chart: {
				height: 500,
				type: "bar",
			},
			series: [{ data: [] }],
		};

		return obj;
	});
</script>

{#if data.length}
	<div use:chart={options}></div>
{:else}
	<div class="flex h-full flex-col items-center justify-center">
		<h3>No Data.</h3>
	</div>
{/if}
