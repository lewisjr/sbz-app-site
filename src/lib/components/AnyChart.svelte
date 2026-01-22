<script module lang="ts">
	//types
	import type { ApexOptions } from "$lib/types";
	import type { ApexDataPresets } from "$lib/types";

	type ApexChartType = keyof ApexDataPresets;

	type Dimension = string | number;

	export interface Props {
		data: ApexDataPresets[ApexChartType];
		/**The chart type*/
		tipo: ApexChartType;
		/**@default "" - empty string*/
		title?: string;
		/**If set, adds randomColours to each **data point**, NOT the series*/
		wRandomColours?: boolean;
		/**Height*/
		h?: Dimension;
		/**Width*/
		w?: Dimension;
		/**Is the x-axis a well formated time series? @default false*/
		isDateTime?: boolean;
		minifyY?: boolean;
		isPercent?: boolean;
		twoDec?: boolean;
		noDec?: boolean;
		/**If true, then the chart won't have any labels*/
		woLabels?: boolean;
	}
</script>

<script lang="ts">
	//functions
	import { mode } from "mode-watcher";
	import { percentageHandler, numberMinifier } from "$lib/utils";
	import { numParse, randomColour } from "@cerebrusinc/qol";
	// @ts-ignore
	import { chart } from "svelte-apexcharts?client";
	import PolarArea from "../../routes/admin/home/(blocks)/ticketBlocks/PolarArea.svelte";

	let {
		data,
		tipo,
		title = undefined,
		wRandomColours,
		h = 550,
		w,
		isPercent,
		isDateTime,
		minifyY,
		twoDec,
		noDec,
		woLabels = false,
	}: Props = $props();

	const chartTypeIfier = (
		val: ApexChartType,
	):
		| "line"
		| "area"
		| "bar"
		| "pie"
		| "donut"
		| "radialBar"
		| "scatter"
		| "bubble"
		| "heatmap"
		| "candlestick"
		| "boxPlot"
		| "radar"
		| "polarArea"
		| "rangeBar"
		| "rangeArea"
		| "treemap" => {
		switch (val) {
			case "Column":
				return "bar";
			case "RangeColumn":
				return "rangeBar";
			case "TreeMap":
				return "treemap";
			case "TreeMapPercent":
				return "treemap";
			case "PolarArea":
				return "polarArea";
			default:
				return "area";
		}
	};

	let options = $derived.by(() => {
		if ("series" in data) {
		} else {
			let _data = JSON.parse(
				JSON.stringify(
					data.filter((item) => {
						if (typeof item.y === "number") return item.y;

						return item.y[0] || item.y[1];
					}),
				),
			) as typeof data;

			if (wRandomColours) {
				_data = _data.map((d) => {
					return {
						x: d.x,
						y: d.y,
						fillColor: randomColour(),
					};
				}) as typeof data;
			}

			const obj: ApexOptions = {
				series: [
					{
						name: title,
						data: _data,
					},
				],
				chart: {
					type: chartTypeIfier(tipo),
					height: h,
					width: "100%",
					zoom: {
						enabled: false,
					},
					toolbar: {
						show: false,
					},
				},
				title: {
					text: title,
					align: "center",
					margin: -13,
					offsetY: 7,
					style: {
						fontWeight: 600,
						fontFamily: '"Montserrat"',
						color: mode.current === "dark" ? "#8a8a8a" : "black",
						fontSize: "12px",
					},
				},
				dataLabels: {
					enabled: !woLabels,
					dropShadow: {
						enabled: true,
					},
					formatter: (_, opts) => {
						const { dataPointIndex } = opts;

						const val = _data[dataPointIndex].y;

						if (typeof val !== "object") {
							const _val = Number(`${val}`);

							if (tipo === "TreeMapPercent")
								return [
									_data[dataPointIndex].x,
									numParse(percentageHandler(_val).replace("%", "")) + "%",
								];

							if (minifyY) return numberMinifier(_val);
							else if (isPercent) return numParse(percentageHandler(_val).replace("%", "")) + "%";
							else if (twoDec) return numParse(_val.toFixed(2));
							else if (noDec) return numParse(_val.toFixed(0));
							else return numParse(_val.toString());
						}

						const vf = val[1];
						const vi = val[0];
						const vdiff = vf - vi;
						const vpercent = vdiff / vi;

						return vpercent === Infinity
							? "100%"
							: numParse(percentageHandler(vpercent).replace("%", "")) + "%";
					},
					style: {
						fontSize: "9px",
					},
					textAnchor: "middle",
				},
				stroke: {
					curve: "smooth",
				},
				plotOptions: {
					bar: tipo === "RangeColumn" ? { horizontal: false } : { horizontal: true },
					treemap: tipo.includes("TreeMap")
						? {
								enableShades: true,
								dataLabels: { format: "truncate" },
								borderRadius: 0,
								useFillColorAsStroke: true,
							}
						: undefined,
				},
				yaxis: {
					labels: {
						formatter: (val, ops) => {
							if (minifyY) return numberMinifier(val);
							else if (isPercent) return numParse(percentageHandler(val).replace("%", "")) + "%";
							else if (twoDec) return numParse(val.toFixed(2));
							else if (noDec) return numParse(val.toFixed(0));
							else return numParse(val.toString());
						},
						style: {
							fontWeight: 600,
							colors: mode.current === "dark" ? "#8a8a8a" : "black",
						},
						offsetX: 10,
						offsetY: -10,
						align: "left",
					},
					floating: true,
				},
				xaxis: {
					labels: {
						style: {
							fontWeight: 600,
							colors: mode.current === "dark" ? "#8a8a8a" : "black",
						},
						rotateAlways: _data.length > 9 ? true : false,
					},
					type: isDateTime ? "datetime" : "category",
					tickPlacement: "on",
				},
				tooltip: {
					theme: mode.current || "dark",
					/*
					custom: ({ series, seriesIndex, dataPointIndex: dataPointIndex, w }) => {
						return `<div class="px-4 py-2 flex flex-col items-center"></div>`;
					},
					*/
				},
			};

			return obj;
		}
	});
</script>

<div use:chart={options}></div>

<style lang="scss">
	div {
		width: 100%;
	}
</style>
