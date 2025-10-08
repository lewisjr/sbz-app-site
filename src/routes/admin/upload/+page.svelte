<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index.js";

	//icons
	import { GitCompareArrows } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponseWData, SettleTradeUploadResponse } from "$lib/types";
	import { numParse } from "@cerebrusinc/qol";
	import { percentageHandler, prettyDate } from "$lib/utils";

	let { data }: PageProps = $props();

	type DataType = "ZMW Settlement" | "USD Settlement";
	let dataType = $state<DataType>("ZMW Settlement");

	let dataTypeUdf = $derived.by(() => {
		let val: string = "";

		switch (dataType) {
			case "ZMW Settlement":
				val = "zmw";
				break;
			case "USD Settlement":
				val = "usd";
				break;
			default:
				val = "null";
				break;
		}

		return val;
	});

	let textHelper = $derived.by(() => {
		let title: string = "";
		let desc: string = "";

		switch (dataType) {
			case "ZMW Settlement":
				title = "Settle Kwacha Trades";
				desc =
					"Upload the LuSE final settlement report as a pdf and settle trades. It will update portfolios and generate contract notes.";
				break;
			case "USD Settlement":
				title = "Settle Dollar Trades";
				desc =
					"Upload the LuSE final settlement report as a pdf and settle trades. It will update portfolios and generate contract notes.";
				break;
		}

		return {
			title,
			desc,
		};
	});

	let loading = $state<boolean>(false);

	let tradeApiResponse = $state<SettleTradeUploadResponse | undefined>(undefined);

	const handleFileUpload = async (e: any) => {
		const doc: File = e.target.files[0];

		if (!doc) {
			toast.error("Please upload a valid file.");
			return;
		}

		const docSize: number = doc.size;

		if (!docSize) {
			toast.error("This file is empty!");
			return;
		}

		toast.info("Processing...");

		loading = true;

		// initial process time
		const ti = Date.now();

		try {
			const formData = new FormData();
			formData.append("settle", doc);
			formData.append("udf1", dataTypeUdf);

			const req = await fetch("/api/admin/upload", {
				method: "PUT",
				body: formData,
			});

			const res: GenericResponseWData<SettleTradeUploadResponse | undefined> = await req.json();

			// console.log(res);

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			//console.log({ res });

			const tf = Date.now();

			const processTime = (tf - ti) / 1000;

			if (dataType.includes("Settlement"))
				toast.success(`Pre-settlement ran in '${processTime.toFixed(2)}' seconds!`);

			tradeApiResponse = res.data;
		} catch (ex: any) {
			toast.error(ex.toString());
		}
	};

	const settleTrades = async () => {
		if (tradeApiResponse) {
			toast.info(
				`Settling ${dataTypeUdf.toUpperCase()} ${prettyDate(tradeApiResponse.trades[0].date || "")}...`,
			);

			loading = true;

			try {
				const req = await fetch("/api/admin/upload", {
					method: "POST",
					body: JSON.stringify({ obj: tradeApiResponse.trades, udf1: dataTypeUdf }),
				});

				const res = await req.json();

				loading = false;

				if (!res.success) {
					toast.error(res.message);
				}

				toast.success(res.message);

				tradeApiResponse = undefined;
			} catch (ex: any) {
				loading = false;
				toast.error(ex.toString());
			}
		} else {
			toast.error("Lost settled trades data, please referesh and try again.");
		}
	};
</script>

<Head
	title="Upload | SBZ Admin"
	ogTitle="Upload"
	description="Settle trades, and keep the database up to date."
	ogDescription="Settle trades, and keep the database up to date."
/>

<div class="flex flex-row items-center justify-between">
	<div class="flex items-center">
		<h1 class="whitespace-nowrap">Data Upload</h1>
	</div>
	<div class="flex w-[100%] items-center justify-end">
		<Tabs.Root bind:value={dataType} class="ml-5">
			<Tabs.List>
				<Tabs.Trigger class="cursor-pointer" value="ZMW Settlement">ZMW Settlement</Tabs.Trigger>
				<Tabs.Trigger class="cursor-pointer" value="USD Settlement">USD Settlement</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
</div>

<div class="main-tainer">
	<h3>{textHelper.title}</h3>
	<div class="my-5 grid w-full max-w-sm items-center gap-1.5">
		<!-- <Label>Upload</Label> -->
		<Input
			disabled={loading}
			class="my-1 cursor-pointer"
			type="file"
			accept="application/pdf"
			onchange={handleFileUpload}
		/>
	</div>
	<p>{textHelper.desc}</p>

	{#if tradeApiResponse}
		<div class="spacer"></div>

		<h3>{prettyDate(tradeApiResponse.date)} Settlement Summary</h3>

		<p class="my-5">
			A total of <span class="num">{numParse(tradeApiResponse.trades.length)}</span> trades are set
			to settle today comprised of
			<span class="num"
				>{numParse(tradeApiResponse.totalBuyClients)} ({percentageHandler(
					tradeApiResponse.totalBuyClients / tradeApiResponse.trades.length,
				)})</span
			> <i>buy</i> trades and
			<span class="num"
				>{numParse(tradeApiResponse.totalSellClients)} ({percentageHandler(
					tradeApiResponse.totalSellClients / tradeApiResponse.trades.length,
				)})</span
			> <i>sell</i> trades.<br /><br /><b>Total Purchases</b> = {dataTypeUdf.toUpperCase()}
			<span class="num">{numParse(tradeApiResponse.totalBuy.toFixed(2))}</span><br /><b
				>Total Sales</b
			>
			= {dataTypeUdf.toUpperCase()}
			<span class="num">{numParse(tradeApiResponse.totalSell.toFixed(2))}</span><br /><b
				>Net Purchases</b
			>
			= {dataTypeUdf.toUpperCase()}
			<span class="num">{numParse(tradeApiResponse.netVal.toFixed(2))}</span>
		</p>

		<Button disabled={loading} onclick={settleTrades}
			>Settle<GitCompareArrows class="h-4 w-4" /></Button
		>
	{/if}
</div>

<style lang="scss">
	.main-tainer {
		height: calc(100% - 50px);
		width: 100%;
		//background: red;
		margin-top: 5px;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		p {
			width: 63%;
			text-align: center;
		}

		.spacer {
			width: 73%;
			height: 1px;
			margin: 15px 0px;
			background-color: var(--foreground);
		}
	}
</style>
