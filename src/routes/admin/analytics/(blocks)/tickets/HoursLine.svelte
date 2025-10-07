<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ResolutionAnalytics } from "../../types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		data: ResolutionAnalytics;
	}

	let { data }: Props = $props();

	const _24to12 = (value: number): string => {
		if (!value) return `12 AM`;
		else if (value < 12) return `${value} AM`;
		else if (value == 12) return `${value} PM`;
		else return `${value - 12} PM`;
	};

	let options = $derived.by(() => {
		const columns: { x: number; y: number }[] = [];

		data.hourCounts.forEach((t, i) => columns.push({ x: i, y: t }));

		const obj: ApexOptions = {
			chart: {
				height: 200,
				type: "area",
				toolbar: {
					show: false,
				},
				zoom: {
					enabled: false,
				},
				sparkline: {
					enabled: true,
				},
			},
			title: {
				text: `Peak Query Time • ${_24to12(data.peakHour)}`,
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "12pt",
				},
				offsetY: 10,
			},
			series: [
				{
					data: columns,
					color: randomColour(),
				},
			],
			tooltip: {
				enabled: true,
				theme: mode.current === "dark" ? "dark" : "light",
				custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
					return `<div class="px-4 py-2 flex flex-col items-center">
								<span>
									<strong>${_24to12(columns[dataPointIndex].x)}</strong>
								</span>
								<span>
									<strong>${numParse(columns[dataPointIndex].y)} Queries
								</span>
							</div>`;
				},
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>
