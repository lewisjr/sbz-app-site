<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";
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
		const responders = data.responders.map((r) => {
			return { x: r.name, y: r.volume };
		});

		responders.sort((a, b) => b.y - a.y);

		const obj: ApexOptions = {
			chart: {
				height: 300,
				type: "bar",
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
				text: "Responders",
				align: "center",
				style: {
					color: mode.current === "dark" ? "#eee" : "#000",
					fontSize: "11pt",
				},
				offsetY: 10,
			},
			series: [
				{
					data: responders.map((r) => r.y),
					color: randomColour(),
				},
			],
			plotOptions: {
				bar: {
					horizontal: true,
					borderRadius: 17,
					borderRadiusApplication: "end",
					dataLabels: {
						position: "center",
					},
				},
			},
			dataLabels: {
				enabled: true,
				textAnchor: "middle",
				formatter: (_, opts) => {
					const { x, y } = responders[opts.dataPointIndex];
					return `${x} • ${numParse(y)} • ${percentageHandler(y / responders.reduce((sum, item) => sum + item.y, 0))}`;
				},
				background: {
					enabled: true,
					foreColor: "black",
					dropShadow: {
						enabled: true,
					},
				},
			},
			tooltip: {
				enabled: false,
			},
		};

		return obj;
	});
</script>

<div use:chart={options}></div>
