<script lang="ts">
	//functions
	import { prettyDate } from "$lib/utils";
	import { toast } from "svelte-sonner";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index";

	//componenets - shadcn
	import { Spinner } from "$lib/components/ui/spinner/index";
	import AnyDrawer from "$lib/components/AnyDrawer.svelte";

	//icons
	import { Download } from "@lucide/svelte";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//types
	import type { GenericResponseWData, NewsLean } from "$lib/types";
	import type { PageProps } from "./$types";
	import { numParse } from "@cerebrusinc/qol";
	import { onMount } from "svelte";

	let { data }: PageProps = $props();

	let tabValue = $state<"trades" | "cns">("trades");

	let isMobile = $derived($screenWidthStore < 767);

	let src = $state<string>("");

	let spinners = $state<{ [key: string]: boolean }>({});

	let mob = $derived.by(() => {
		return /Android|iPhone/i.test(navigator.userAgent);
	});

	const addSpin = (i: number) => {
		const _spin = JSON.parse(JSON.stringify(spinners)) as typeof spinners;

		if (!_spin) {
			toast.error("Failed to get reports.");
			return;
		}

		_spin[i.toString()] = true;

		spinners = _spin;
	};

	const removeSpin = (i: number) => {
		const _spin = JSON.parse(JSON.stringify(spinners)) as typeof spinners;

		if (!_spin) {
			toast.error("Failed to get reports.");
			return;
		}

		_spin[i.toString()] = false;

		spinners = _spin;
	};

	const genReport = async (i: number, date: number) => {
		const isSPinning = spinners[i.toString()];

		if (isSPinning) {
			toast.info("Please wait for the pending report to load.");
			return;
		} else {
			addSpin(i);
		}

		try {
			const req = await fetch("/api/d/gen", {
				method: "POST",
				body: JSON.stringify({ date }),
			});

			removeSpin(i);

			if (req.status === 500) {
				toast.error("We are experiencing difficulties, please try again in a few minutes.");
				return;
			}

			const _arrayBufferToBase64 = (buffer: ArrayBuffer) => {
				let binary = "";
				const bytes = new Uint8Array(buffer);
				const chunkSize = 0x8000;
				for (let i = 0; i < bytes.length; i += chunkSize) {
					const chunk = bytes.subarray(i, i + chunkSize);
					binary += String.fromCharCode(...chunk);
				}
				return btoa(binary);
			};

			if (isMobile) {
				const res = await req.arrayBuffer();
				const b64 = _arrayBufferToBase64(res);
				src = "https://snippet.embedpdf.com/ebook.pdf";
			} else {
				const res = await req.blob();
				src = URL.createObjectURL(res);
			}

			openTrigger = Date.now();
		} catch (ex) {
			removeSpin(i);
		}
	};

	let openTrigger = $state<number>(0);

	let PDFViewer = $state<typeof import("@embedpdf/svelte-pdf-viewer").PDFViewer | undefined>(
		undefined,
	);

	onMount(async () => {
		const module = await import("@embedpdf/svelte-pdf-viewer");
		PDFViewer = module.PDFViewer;
	});
</script>

<Head
	title="Reports | SBZ Digital"
	ogTitle="Reports"
	description="Download your historical reports!"
	ogDescription="Download your historical reports!"
/>

<div class="relative flex flex-col">
	<Tabs.Root value="trades">
		<Tabs.List>
			<Tabs.Trigger value="trades">Trades</Tabs.Trigger>
			<Tabs.Trigger value="cns">Contract Notes</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</div>

{#if data.noData}
	<h4 class="mt-3 w-full">No data to show.</h4>
{:else}
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
						<td class="num text-center">{!m.buys ? "-" : numParse(m.buys.toFixed(2))}</td>
						<td class="num text-center">{!m.sells ? "-" : numParse(m.sells.toFixed(2))}</td>
						<td
							><button onclick={() => genReport(i, m.date)} class="m-0 p-0">
								{#if spinners[i]}
									<Spinner class="h-3 w-3" />
								{:else}
									<Download class="h-3 w-3" />
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

<AnyDrawer {openTrigger} big description="" title="">
	{#snippet main()}
		{#if isMobile && PDFViewer !== undefined}
			<PDFViewer
				config={{
					src: "https://snippet.embedpdf.com/ebook.pdf",
				}}
				style="width: 100%; height: 100%;"
			/>
		{:else}
			<iframe title="Doc" style="border: 1px solid red;" {src} width="100%" height="800"></iframe>
		{/if}
	{/snippet}
</AnyDrawer>

<style lang="scss">
	.summary-table {
		//border: 1px solid var(--shadow);
		width: 100%;
		max-height: 300px;
		overflow-y: auto;
		position: relative;

		table {
			border-collapse: separate !important;
			border-spacing: 0 !important;
		}

		table thead th {
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
