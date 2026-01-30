<script lang="ts">
	//functions
	import { prettyDate } from "$lib/utils";
	import { toast } from "svelte-sonner";
	import { browser } from "$app/environment";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index";

	//componenets - shadcn
	import { Spinner } from "$lib/components/ui/spinner/index";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";
	import Button from "$lib/components/ui/button/button.svelte";

	//icons
	import { Download } from "@lucide/svelte";

	//stores
	import { screenWidthStore, isAppStore } from "$lib/stores";

	//types
	import type { PageProps } from "./$types";
	import { numParse } from "@cerebrusinc/qol";
	import { onMount, tick } from "svelte";

	// annoying pdf
	onMount(async () => {
		// @ts-ignore
		window.pdfjsLib.GlobalWorkerOptions.workerSrc =
			"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.mjs";
	});

	let { data }: PageProps = $props();

	let tabValue = $state<"trades" | "cns">("trades");

	let isMobile = $derived($screenWidthStore < 767);

	let src = $state<string>("");

	let spinners = $state<{ [key: string]: boolean }>({});
	let spinnersTwo = $state<{ [key: string]: boolean }>({});
	let spinnersThree = $state<{ [key: string]: boolean }>({});

	const addSpin = (i: number, cfg?: "2" | "3") => {
		let _spin: typeof spinners = {};

		if (!cfg) JSON.parse(JSON.stringify(spinners)) as typeof spinners;
		if (cfg && cfg === "2") JSON.parse(JSON.stringify(spinnersTwo)) as typeof spinners;
		if (cfg && cfg === "3") JSON.parse(JSON.stringify(spinnersThree)) as typeof spinners;

		if (!_spin) {
			toast.error("Failed to get reports.");
			return;
		}

		_spin[i.toString()] = true;

		if (!cfg) spinners = _spin;
		if (cfg && cfg === "2") spinnersTwo = _spin;
		if (cfg && cfg === "3") spinnersThree = _spin;
	};

	const removeSpin = () => {
		spinners = {};
		spinnersTwo = {};
		spinnersThree = {};
	};

	let pdfData = $state<ArrayBuffer | null>(null);

	// Load PDF.js UMD once on mount
	onMount(async () => {
		if (!browser) return;

		// @ts-ignore
		window.pdfjsLib.GlobalWorkerOptions.workerSrc =
			"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";

		//console.log("[log] dependencies set");
	});

	let selectedIndex = $state<number>(0);

	const genReport = async (i: number, date: number) => {
		const isSPinning = spinners[i.toString()];

		if (isSPinning) {
			toast.info("Please wait for the pending report to load.");
			return;
		} else {
			addSpin(i);
			selectedIndex = i;
		}

		try {
			const req = await fetch("/api/d/gen", {
				method: "POST",
				body: JSON.stringify({ date }),
			});

			removeSpin();

			if (req.status === 500) {
				toast.error("We are experiencing difficulties, please try again in a few minutes.");
				return;
			}

			if (isMobile) {
				const arrayBuffer = await req.arrayBuffer();
				openTrigger = Date.now();
				await tick();
				setTimeout(() => {
					pdfData = arrayBuffer.slice(0); // <-- reactive effect will run here
				}, 300);
			} else {
				const res = await req.blob();
				openTrigger = Date.now();
				src = URL.createObjectURL(res);
			}
		} catch (ex) {
			removeSpin();
		}
	};

	const genCns = async (i: number, date: number) => {
		const isSPinning = spinnersTwo[i.toString()];

		// console.log({ isSPinning, spinnersTwo, i });

		if (isSPinning) {
			toast.info("Please wait for the pending contract note to load.");
			return;
		} else {
			addSpin(i, "2");
			selectedIndex = i;
		}

		try {
			const req = await fetch("/api/d/gen", {
				method: "PUT",
				body: JSON.stringify({ date }),
			});

			removeSpin();

			if (req.status === 500) {
				toast.error("We are experiencing difficulties, please try again in a few minutes.");
				return;
			}

			removeSpin();

			if (isMobile) {
				const arrayBuffer = await req.arrayBuffer();
				openTrigger = Date.now();
				await tick();
				setTimeout(() => {
					pdfData = arrayBuffer.slice(0); // <-- reactive effect will run here
				}, 300);
			} else {
				const res = await req.blob();
				openTrigger = Date.now();
				src = URL.createObjectURL(res);
			}
		} catch (ex) {
			removeSpin();
		}
	};

	let openTrigger = $state<number>(0);
	let forceClose = $state<number>(0);

	let pdfViewerInstance = $state<any>(null);

	const refreshDom = async () => {
		await tick(); // wait for drawer DOM

		const container = document.getElementById("mob");
		if (!container) return;

		// 🔥 FULL TEARDOWN
		container.innerHTML = "";

		const viewerEl = document.createElement("div");
		viewerEl.id = "pdfViewer";
		container.appendChild(viewerEl);

		// @ts-ignore
		const eventBus = new window.pdfjsViewer.EventBus();

		// @ts-ignore
		pdfViewerInstance = new window.pdfjsViewer.PDFViewer({
			container,
			viewer: viewerEl,
			eventBus,
			removePageBorders: true,
		});

		eventBus.on("pagesinit", () => {
			pdfViewerInstance.currentScaleValue = "page-width";
		});

		// @ts-ignore
		const loadingTask = window.pdfjsLib.getDocument(new Uint8Array(pdfData));

		const doc = await loadingTask.promise;
		pdfViewerInstance.setDocument(doc);
	};

	$effect(() => {
		if (!browser || !pdfData || !openTrigger) return;
		else refreshDom();
	});

	let downloading = $state<boolean>(false);

	// $effect(() => console.log({ tabValue }));

	const dldApp = async (file: Blob, fname: string) => {
		const _blobToBase64 = async (blob: Blob): Promise<string> => {
			const buffer = await blob.arrayBuffer();
			let binary = "";
			const bytes = new Uint8Array(buffer);
			const chunkSize = 0x8000;

			for (let i = 0; i < bytes.length; i += chunkSize) {
				binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
			}

			return btoa(binary);
		};

		downloading = false;

		try {
			const msg = {
				type: "SHARE_FILE",
				filename: fname,
				mime: "application/pdf",
				data: await _blobToBase64(file),
				dialog: `Share your ${tabValue === "cns" ? "Contract Note(s)" : "Trade Report"}.`,
			};

			// @ts-ignore
			window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
		} catch (ex) {
			// toast.error(String(ex));
			toast.error("Please wait a few seconds and try again.");
		}
	};

	const dld = async () => {
		if (!pdfData) {
			toast.error("Failed to download document.");
			return;
		}

		downloading = true;

		await tick();

		let title = "";
		const ext = ".pdf";

		switch (tabValue) {
			case "trades":
				title = `${data.luseId}LI Trade Report - ${prettyDate(data.matchedSummary[selectedIndex].date)}`;
				break;
			case "cns":
				title = `${data.luseId}LI Contract Notes - ${prettyDate(data.cnSummary[selectedIndex].date)}`;
				break;
			default:
				title = "error";
		}

		await tick();

		const blob = new Blob([pdfData], { type: "application/pdf" });

		// toast.info(`check = ${$isAppStore}`);

		if ($isAppStore) {
			downloading = false;
			await dldApp(blob, `${title}${ext}`);
			return;
		}

		const file = new File([blob], `${title}${ext}`, {
			type: "application/pdf",
		});

		try {
			if (navigator.canShare && navigator.canShare({ files: [file] })) {
				downloading = false;
				forceClose = Date.now();

				await navigator.share({
					title,
					text: "",
					files: [file],
				});
				return;
			} else {
				const url = URL.createObjectURL(blob);

				const a = document.createElement("a");
				a.href = url;
				a.download = `${title}${ext}`;
				document.body.appendChild(a);
				a.click();

				downloading = false;
				forceClose = Date.now();

				// cleanup
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch {
			removeSpin();
			await tick();
			title = "";
			downloading = false;
			forceClose = Date.now();
			await tick();
		}
	};

	let currency = $state<"ZMW" | "USD">("ZMW");
</script>

<Head
	title="Reports | SBZ Digital"
	ogTitle="Reports"
	description="Download your historical reports!"
	ogDescription="Download your historical reports!"
/>
<svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf_viewer.min.js"></script>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf_viewer.min.css"
	/>
</svelte:head>

<div class="relative flex flex-col">
	<Tabs.Root bind:value={tabValue}>
		<Tabs.List>
			<Tabs.Trigger value="trades">Trades</Tabs.Trigger>
			<Tabs.Trigger value="cns">Contract Notes</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</div>

{#if data.noData}
	<h4 class="mt-3 w-full">No data to show.</h4>
{:else if tabValue === "trades"}
	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		Please note that the table below shows total values in <button
			class="m-0 p-0 text-[8pt]"
			onclick={() => (currency === "USD" ? (currency = "ZMW") : (currency = "USD"))}
			><u>{currency}</u></button
		>. To change, please click the underlined currency.
	</p>
	<table class="summary-table mt-5 w-full">
		<thead
			><tr>
				<th>Date</th>
				<th>Total Buys</th>
				<th>Total Sells</th>
			</tr></thead
		>
		<tbody>
			{#if data.matchedSummary.length}
				{#each data.matchedSummary as m, i}
					<tr>
						<td class="num text-center">{prettyDate(m.date)}</td>

						{#if currency === "ZMW"}
							<td class="num text-center">{!m.buys ? "-" : numParse(m.buys.toFixed(2))}</td>
							<td class="num text-center">{!m.sells ? "-" : numParse(m.sells.toFixed(2))}</td>
						{:else}
							<td class="num text-center"
								>{!m.buys ? "-" : numParse((m.buys / data.fx["sell"]).toFixed(2))}</td
							>
							<td class="num text-center"
								>{!m.sells ? "-" : numParse((m.sells / data.fx["sell"]).toFixed(2))}</td
							>
						{/if}

						<td
							><button
								onclick={() => genReport(i, m.date)}
								class="m-0 flex w-[100%] items-center p-0"
							>
								{#if spinners[i]}
									<Spinner class="m-0 h-3 w-3 p-0" />
								{:else}
									<Download class="mx-auto h-3 w-3" />
								{/if}
							</button></td
						>
					</tr>
				{:else}
					<tr><td>No data to show.</td></tr>
				{/each}
			{/if}
		</tbody>
	</table>
{:else if tabValue === "cns"}
	<p class="mt-2 text-justify text-[0.7em] text-muted-foreground">
		Please note that the table below shows total values in <button
			class="m-0 p-0 text-[8pt]"
			onclick={() => (currency === "USD" ? (currency = "ZMW") : (currency = "USD"))}
			><u>{currency}</u></button
		>. To change, please click the underlined currency.
	</p>
	<table class="summary-table mt-5 w-full">
		<thead
			><tr>
				<th>Date</th>
				<th>Total Buys</th>
				<th>Total Sells</th>
			</tr></thead
		>
		<tbody>
			{#if data.cnSummary.length}
				{#each data.cnSummary as m, i}
					<tr>
						<td class="num text-center">{prettyDate(m.date)}</td>

						{#if currency === "ZMW"}
							<td class="num text-center">{!m.buys ? "-" : numParse(m.buys.toFixed(2))}</td>
							<td class="num text-center">{!m.sells ? "-" : numParse(m.sells.toFixed(2))}</td>
						{:else}
							<td class="num text-center"
								>{!m.buys ? "-" : numParse((m.buys / data.fx["sell"]).toFixed(2))}</td
							>
							<td class="num text-center"
								>{!m.sells ? "-" : numParse((m.sells / data.fx["sell"]).toFixed(2))}</td
							>
						{/if}

						<td
							><button onclick={() => genCns(i, m.date)} class="m-0 flex w-[100%] items-center p-0">
								{#if spinnersTwo[i]}
									<Spinner class="m-0 h-3 w-3 p-0" />
								{:else}
									<Download class="mx-auto h-3 w-3" />
								{/if}
							</button></td
						>
					</tr>
				{:else}
					<tr><td>No data to show.</td></tr>
				{/each}
			{/if}
		</tbody>
	</table>
{/if}

<AnyDrawer {openTrigger} big description="" title="" {forceClose}>
	{#snippet main()}
		{#if isMobile}
			<div id="mob">
				<div id="pdfViewer"></div>
			</div>
		{:else}
			<iframe title="Doc" style="border: 1px solid red;" {src} width="100%" height="800"></iframe>
		{/if}
	{/snippet}

	{#snippet actionButton()}
		<Button onclick={dld}>
			{#if downloading}
				<Spinner class="ml-2 h-4 w-4" />
			{:else}
				Download<Download class="ml-2 h-4 w-4" />
			{/if}
		</Button>
	{/snippet}
</AnyDrawer>

<!-- ignore -->
<div id="mob-2" style="display: hidden;position:absolute">
	<div id="pdfViewer-2" style="display: hidden;position:absolute"></div>
</div>

<!-- ignore -->

<style lang="scss">
	.summary-table {
		//border: 1px solid var(--shadow);
		width: 100%;
		max-height: 300px;
		overflow-y: auto;
		position: relative;
		border-collapse: separate !important;
		border-spacing: 0 !important;

		thead th {
			position: sticky !important;
			top: 0 !important;
			z-index: 11 !important;
			background-color: var(--background) !important;
		}

		th,
		td {
			padding: 5px 10px;
		}

		tbody tr:nth-child(odd) {
			background-color: var(--muted);
		}
	}

	#mob {
		width: calc(100% - 7px);
		height: 100%;
		overflow-y: auto; // scroll vertically
		overflow-x: hidden; // hide horizontal scroll
		// border: 1px solid red;
		position: absolute;
		padding: 0px;
		left: 0px;
		top: 0px;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
	}

	@media screen and (max-width: 767px) {
		.summary-table {
			&* {
				font-size: 0.8em;
			}
		}
	}
</style>
