<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { randomColour } from "@cerebrusinc/qol";
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
		const { min, q1, median, q3, max, average, p90, p95 } = data.timeStats;

		if (!data.timeRanges.min) {
			const obj: ApexOptions = {
				chart: {
					height: 300,
					type: "boxPlot",
					toolbar: {
						show: false,
					},
				},
				series: [{ data: [] }],
			};

			return obj;
		}

		const obj: ApexOptions = {
			chart: {
				height: 300,
				type: "boxPlot",
				toolbar: {
					show: false,
				},
			},
			series: [
				{
					data: [
						{
							x: "Percentiles",
							y: [min.toFixed(2), q1.toFixed(2), median.toFixed(2), q3.toFixed(2), max.toFixed(2)],
						},
					],
					type: "boxPlot",
				},
			],
			title: {
				text: `Time-to-Resolve • x̄: ${average.toFixed(2)}h • P90: ${p90.toFixed(2)}h • P95: ${p95.toFixed(2)}h`,
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "11pt",
				},
				offsetY: 15,
			},
			yaxis: {
				show: false,
			},
			xaxis: {
				labels: {
					style: {
						fontWeight: 600,
						colors: mode.current === "dark" ? "#eee" : undefined,
					},
				},
			},
			plotOptions: {
				boxPlot: {
					colors: {
						upper: randomColour(),
						lower: randomColour(),
					},
				},
			},
			grid: {
				show: false,
			},
			tooltip: {
				enabled: true,
				theme: mode.current === "dark" ? "dark" : "light",
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
