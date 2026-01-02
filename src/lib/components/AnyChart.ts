import anyChart from "./AnyChart.svelte";
import type { Component } from "svelte";
import type { Props } from "./AnyChart.svelte";

/**
 * ### AnyChart!
 *
 * This component allows for the generation of ANY ```ApexCharts``` **singular** chart, meaning it only accepts one series. To get multiple series on one chart, import ```AnyComparator``` instead.
 *
 * The **x-axis** can be modified by setting the ```isDateTime``` prop, this will change the date from the default **category** to *datetime*.
 *
 * The **y-axis** can be modified with the following props (if all are ```false``` or ```undefined``` then the values will display based on ```ApexCharts``` internals), **NOTE** that they do not stack but are sequencial as follows:
 * - **minifyY**, if ```true``` then the Y axis values will be shortened to include abbreviations such as "M", "B", and "T"
 * - **isPercent**, if ```true``` then the Y axis values will be displayed as percentages and not decimals
 * - **twoDec**, if ```true``` then the Y axis values will enforce two decimals no matter what
 * - **noDec**, if ```true``` then the Y axis values will enforce no decimals no matter what
 */
const AnyChart = anyChart;

export default AnyChart;
