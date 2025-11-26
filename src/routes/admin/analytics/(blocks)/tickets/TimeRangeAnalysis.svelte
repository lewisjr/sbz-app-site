<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	import { devLog, percentageHandler } from "$lib/utils";
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
		const colour = randomColour();

		const columns: { x: string; y: number; fillColor: string }[] = [];

		Object.keys(data.timeRanges).forEach((t) =>
			columns.push({ x: t, y: data.timeRanges[t], fillColor: colour }),
		);

		// devLog({ columns }, "TimeRangeAnalysis.svelte:28");

		columns.sort((a, b) => {
			const startA = parseInt(a.x.split("-")[0], 10);
			const startB = parseInt(b.x.split("-")[0], 10);
			return startA - startB;
		});

		const obj: ApexOptions = {
			chart: {
				height: 400,
				type: "bar",
				toolbar: {
					show: false,
				},
			},
			series: [
				{
					data: columns,
				},
			],
			title: {
				text: "Time-to-Resolve • Range Analysis",
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "12pt",
				},
				offsetY: 15,
			},
			yaxis: {
				show: false,
			},
			xaxis: {
				offsetY: 8,
				labels: {
					style: {
						fontWeight: 600,
						colors: mode.current === "dark" ? "#eee" : undefined,
					},
				},
			},
			plotOptions: {
				bar: {
					horizontal: false,
					dataLabels: {
						position: "top",
					},
				},
			},
			dataLabels: {
				textAnchor: "middle",
				enabled: true,
				dropShadow: {
					enabled: true,
					blur: 10,
				},
				style: {
					fontSize: "10pt",
				},
				background: {
					enabled: true,
					foreColor: "#000",
				},
			},
			grid: {
				show: false,
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
