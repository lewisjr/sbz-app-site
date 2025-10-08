<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";

	//components - custom
	import Head from "$lib/components/Head.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Table from "$lib/components/ui/table/index";
	import Label from "$lib/components/ui/label/label.svelte";

	//types
	import type { PageProps } from "./$types";
	import { prettyDate } from "$lib/utils";

	let { data }: PageProps = $props();

	type DataType = "ZMW Settlement" | "USD Settlement";
	let dataType = $state<DataType>("ZMW Settlement");

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

			const req = await fetch("/api/admin/upload", {
				method: "PUT",
				body: formData,
			});

			const res: {
				success: boolean;
				message: string;
				data: string;
			} = await req.json();

			// console.log(res);

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			console.log({ res });

			const tf = Date.now();

			const processTime = (tf - ti) / 1000;
			toast.success(`Processed in '${processTime.toFixed(2)}' seconds!`);
		} catch (ex: any) {
			toast.error(ex.toString());
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
	}
</style>
