<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler } from "$lib/utils";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";

	//types
	import type { TicketsAnalysis } from "../../types";
	import type { ApexOptions } from "$lib/types";

	interface Props {
		data: TicketsAnalysis;
		height?: number;
		offsetY?: number;
		title?: string;

		forceLightMode?: boolean;
	}

	let {
		data,
		forceLightMode = false,
		height = 500,
		offsetY = 0,
		title = "Platform Contribution",
	}: Props = $props();

	let options = $derived.by(() => {
		const platformObj: { [key: string]: { label: string; color: string } } = {
			whatsapp: {
				label: "Whatsapp",
				color: "#25D366",
			},
			messenger: {
				label: "Facebook",
				color: "#3b5998",
			},
			web: {
				label: "web",
				color: "#0072b1",
			},
			email: {
				label: "Email",
				color: "#808080",
			},
		};

		const columns: { x: string; y: number; fillColor: string }[] = [];

		data.platforms.forEach((p, i) => {
			columns.push({
				x: platformObj[p.platform].label,
				y: p.volume,
				fillColor: platformObj[p.platform].color,
			});
		});

		const obj: ApexOptions = {
			chart: {
				height,
				type: "bar",
				toolbar: {
					show: false,
				},
			},
			title: {
				text: title,
				align: "center",
				style: {
					fontSize: "12pt",
					color: forceLightMode ? "#000" : mode.current === "dark" ? "#eee" : "#000",
				},
				offsetY,
			},
			series: [
				{
					data: columns,
				},
			],
			yaxis: {
				show: false,
			},
			xaxis: {
				offsetY: 8,
				labels: {
					style: {
						fontWeight: 600,
						colors: forceLightMode ? "#000" : mode.current === "dark" ? "#eee" : undefined,
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
				// @ts-ignore
				formatter: (_, opt) => {
					const platform = columns[opt.dataPointIndex];
					return [numParse(platform.y), percentageHandler(platform.y / data.total)];
				},
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
