<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { ApexOptions } from "$lib/types";
	import type { RadarData } from "./types";
	import { percentageHandler } from "$lib/utils";

	interface Props {
		data: RadarData;
	}

	let { data }: Props = $props();

	let options = $derived.by(() => {
		if (data.data.length) {
			const total = data.data.reduce((sum, num) => sum + num, 0);

			const obj: ApexOptions = {
				chart: {
					height: 450,
					type: "radar",
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
					text: "WoW Query Types",
					align: "center",
					style: {
						color: mode.current === "dark" ? "#eee" : "#000",
						fontSize: "12pt",
					},
					offsetY: 10,
				},
				series: [
					{
						data: data.data,
					},
				],
				labels: data.labels,
				fill: {
					opacity: 0.7,
					colors: [randomColour()],
				},
				plotOptions: {
					radar: {
						polygons: {
							// @ts-ignore
							strokeWidth: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
						},
					},
				},
				xaxis: {
					labels: {
						show: true,
						style: {
							fontSize: "10pt",
							colors: data.labels.map((l) => (mode.current === "dark" ? "#eee" : "#000")),
						},
					},
				},
				tooltip: {
					enabled: true,
					theme: mode.current === "dark" ? "dark" : "light",
					custom: ({ seriesIndex, dataPointIndex }) => {
						const value = data.data[dataPointIndex];
						const label = data.labels[dataPointIndex];

						return `<div class="px-4 py-2 flex flex-col items-center">
                                    <span>
                                        <strong>${label}</strong>
                                    </span>
                                    <span>
                                        <strong>${label} | ${percentageHandler(value / total)}</strong>
                                    </span>
                                </div>`;
					},
				},
			};

			return obj;
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
