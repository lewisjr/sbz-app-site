<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	import { formatDbTime, percentageHandler } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ResolutionAnalytics } from "../../types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		data: ResolutionAnalytics;
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		const obj: ApexOptions = {
			chart: {
				height: 400,
				type: "scatter",
				toolbar: {
					show: false,
				},
				zoom: {
					enabled: false,
				},
			},
			title: {
				text: "Time-to-Resolve / Time",
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "12pt",
				},
				offsetY: 15,
			},
			colors: [randomColour()],
			series: [
				{
					data: data.scatterData,
				},
			],
			yaxis: {
				tickAmount: 7,
				decimalsInFloat: 0,
				labels: {
					style: {
						colors: mode.current === "dark" ? "#eee" : "#000",
					},
				},
			},
			xaxis: {
				tickAmount: 10,
				type: "datetime",
				labels: {
					style: {
						colors: mode.current === "dark" ? "#eee" : "#000",
					},
				},
			},
			grid: {
				show: true,
				strokeDashArray: 14,
				borderColor: mode.current === "dark" ? "#5e5e5e" : "#d6d6d6",
			},
			tooltip: {
				enabled: true,
				theme: mode.current === "dark" ? "dark" : "light",
				custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
					return `<div class="px-4 py-2 flex flex-col items-center">
								<span>
									<strong>${formatDbTime(new Date(data.scatterData[dataPointIndex][0]).toISOString()).split(",")[0]}</strong>
								</span>
								<span>
									<strong></strong>${numParse(data.scatterData[dataPointIndex][1].toFixed(2))} hours
								</span>
							</div>`;
				},
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>
