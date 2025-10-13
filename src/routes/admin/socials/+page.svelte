<script lang="ts">
	//functions
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";
	import Label from "$lib/components/ui/label/label.svelte";

	//icons
	import {
		Search,
		SlidersHorizontal,
		ChevronLeft,
		ChevronRight,
		Upload,
		PlusCircle,
	} from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponseWData, SBZdb } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";
	import AnyPicker from "$lib/components/AnyPicker.svelte";
	import isEmail from "is-email";
	import DatePicker from "$lib/components/DatePicker.svelte";

	type SocialsRow = SBZdb["public"]["Tables"]["odyn-socials"]["Row"];

	let { data }: PageProps = $props();

	let postsData = $state<SocialsRow[]>([]);
	let loading = $state<boolean>(false);
	let initialising = $state<boolean>(true);

	let isMobile = $derived($screenWidthStore < 767);

	$effect(() => {
		data.socials
			.then((res) => {
				postsData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get staff members! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	const columns: ColumnDef<SocialsRow>[] = [
		{
			accessorKey: "platform",
			header: "Platform",
		},
		{
			accessorKey: "metric",
			header: "Metric",
		},
		{
			accessorKey: "value",
			header: "Value",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | number;
					return {
						render: () => `<span class="num">${numParse(value)}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "date",
			header: "Date Added",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => formatDbTime(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
	];

	type StrongFilter = "none" | "Facebook" | "LinkedIn" | "YouTube" | "Spotify";

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleanedPostsList = $derived.by(() => {
		switch (strongFilter) {
			case "none":
				return postsData;
			case "Facebook":
				const fbSocials = postsData.filter((item) => item.platform === "Facebook");
				return fbSocials;
			case "LinkedIn":
				const liSocials = postsData.filter((item) => item.platform === "LinkedIn");
				return liSocials;
			case "Spotify":
				const spotifySocials = postsData.filter((item) => item.platform === "Spotify");
				return spotifySocials;
			case "YouTube":
				const ytSocials = postsData.filter((item) => item.platform === "YouTube");
				return ytSocials;
			default:
				return postsData;
		}
	});

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filteredPosts = $derived.by(() => {
		return cleanedPostsList.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));

			if (_compare(formatDbTime(entry.date))) res = true;
			if (_compare(entry.metric)) res = true;
			if (_compare(entry.value.toString())) res = true;

			return res;
		});
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return filteredPosts;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	let dateValue = $state<any>(undefined);
	const updateDate = (value: any) => (dateValue = value);
	let resetDatePicker = $state<number>(0);

	let hourValue = $state<string>("08");
	const updateHour = (value: string) => (hourValue = value);
	const hourArray = Array.from({ length: 24 }, (_, i) => {
		const str = i.toString().padStart(2, "0");
		return { label: str, value: str };
	});

	let minuteValue = $state<string>("30");
	const updateMinute = (value: string) => (minuteValue = value);
	const minuteArray = Array.from({ length: 59 }, (_, i) => {
		const str = i.toString().padStart(2, "0");
		return { label: str, value: str };
	});

	let platformValue = $state<string>("Facebook");
	const updatePlatform = (value: string) => (platformValue = value);

	const labelsObj: { [key: string]: string[] } = {
		Facebook: ["Reach", "Likes", "Comments", "Link Clicks", "Followers"],
		LinkedIn: ["Impressions", "Reactions", "Comments", "Reposts", "Followers"],
		X: ["Impressions", "Likes", "Comments", "Reposts", "Followers"],
		YouTube: ["Views", "Likes", "Comments", "Followers", ""],
		Spotify: ["Plays", "", "", "", "Followers"],
	};

	let udf1Val = $state<string>("");
	let udf2Val = $state<string>("");
	let udf3Val = $state<string>("");
	let udf4Val = $state<string>("");
	let udf5Val = $state<string>("");

	let openTrigger = $state<number>(0);
	let forceClose = $state<number>(0);

	const resetSheet = () => {
		dateValue = undefined;
		resetDatePicker = Date.now();

		udf1Val = "";
		udf2Val = "";
		udf3Val = "";
		udf4Val = "";
		udf5Val = "";

		hourValue = "08";
		minuteValue = "30";

		platformValue = "Facebook";
	};

	const openSheet = () => {
		resetSheet();

		openTrigger = Date.now();
	};

	const closeSheet = () => {
		forceClose = Date.now();
	};

	const addNewRow = (obj: SocialsRow[]) => {
		const temp: SocialsRow[] = JSON.parse(JSON.stringify(postsData));

		temp.push(...obj);

		temp.sort((a, b) => (b.date > a.date ? 1 : -1));

		postsData = temp;

		closeSheet();
	};

	const addPost = async () => {
		if (
			!platformValue.length ||
			!udf1Val.length ||
			(platformValue !== "Spotify" && !udf2Val.length) ||
			(platformValue !== "Spotify" && !udf3Val.length) ||
			(platformValue !== "Spotify" && !udf4Val.length) ||
			(platformValue !== "YouTube" && !udf5Val.length) ||
			!dateValue
		) {
			toast.error("One or more of the inputs is empty.");
			return;
		}

		const date = new Date(`${dateValue}T${hourValue}:${minuteValue}+02:00`).toISOString();

		try {
			loading = true;
			toast.info(`Adding ${platformValue} post to Odyn...`);

			const req = await fetch("/api/admin/socials", {
				method: "POST",
				body: JSON.stringify({
					date,
					platform: platformValue,
					udf1: Number(udf1Val),
					udf2: Number(udf2Val),
					udf3: Number(udf3Val),
					udf4: Number(udf4Val),
					udf5: udf5Val.length ? Number(udf5Val) : 0,
				}),
			});

			const res = await req.json();

			if (req.status > 400) {
				goto("/sign-in");
				return;
			}

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			// console.log(res.data);

			addNewRow(res.data);
		} catch (ex: any) {
			console.log(ex);
			toast.error(ex);
		}
	};
</script>

<Head
	title="Socials | SBZ Admin"
	ogTitle="Socials"
	description="Admin section that allows for social media analytics upload."
	ogDescription="Admin section that allows for social media analytics upload."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Socials</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: ...<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Post..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Socials</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Posts..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
					data={{
						grouped: [
							{
								title: "Platform",
								group: [
									{
										label: "Facebook",
										value: "Facebook",
									},
									{
										label: "LinkedIn",
										value: "LinkedIn",
									},
									{
										label: "YouTube",
										value: "YouTube",
									},
									{
										label: "Spotify",
										value: "Spotify",
									},
								],
							},
						],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
					loader
					disabled
				/>
				<Button variant="outline" class="loading no-padding ml-4"
					>Add Post<PlusCircle class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer loading mt-3 flex items-center rounded-md border"></div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<div class="flex items-center justify-between">
					<p class="loading no-padding text-sm opacity-70">
						<strong>Total:</strong> <span class="num">9,999</span>
					</p>
				</div>

				<div class="flex flex-row items-center justify-end">
					<Button variant="outline" size="sm" disabled class="loading"
						><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
					>
					<Button class="loading mx-2" variant="outline" size="sm" disabled>1</Button>
					<Button variant="outline" size="sm" class="loading" disabled
						>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
					>
				</div>
			</div>
		</div>
	{/if}
{:else if !postsData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Socials</h1>
			<Button variant="secondary" class="ml-2" disabled
				>Filter By: ...<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Posts..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Socials</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Posts..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
					disabled
					data={{
						grouped: [
							{
								title: "Platform",
								group: [
									{
										label: "Facebook",
										value: "Facebook",
									},
									{
										label: "LinkedIn",
										value: "LinkedIn",
									},
									{
										label: "YouTube",
										value: "YouTube",
									},
									{
										label: "Spotify",
										value: "Spotify",
									},
								],
							},
						],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
				/>
				<Button variant="outline" class="ml-4" disabled={loading} onclick={() => openSheet()}
					>Add Post<PlusCircle class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
		<div class="main-tainer">
			<div class="table-tainer mt-3 flex items-center rounded-md border">
				<h3 class="mx-auto mt-4 text-center">No data.</h3>
			</div>
		</div>
	{/if}
{:else if isMobile}
	<div class="flex flex-row items-center justify-between">
		<h1>Socials</h1>
		<Button
			variant="secondary"
			class="ml-2"
			onclick={() => {
				null;
			}}>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
		>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter Posts..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Socials</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Posts..."
				type="text"
			/>
			<AnyCombobox
				handler={updateStrongFilter}
				data={{
					grouped: [
						{
							title: "Platform",
							group: [
								{
									label: "Facebook",
									value: "Facebook",
								},
								{
									label: "LinkedIn",
									value: "LinkedIn",
								},
								{
									label: "YouTube",
									value: "YouTube",
								},
								{
									label: "Spotify",
									value: "Spotify",
								},
							],
						},
					],
					ungrouped: [{ label: "None", value: "none" }],
				}}
				dataTitle="Filter"
				classes="ml-4"
				icon="filter"
			/>
			<Button variant="outline" class="ml-4" disabled={loading} onclick={() => openSheet()}
				>Add Post<PlusCircle class="ml-2 h-4 w-4" /></Button
			>
		</div>
	</div>

	<div class="main-tainer">
		<div class="table-tainer mt-3 rounded-md border">
			<div class="h-scroll">
				<Table.Root>
					<Table.Header>
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head
										colspan={header.colSpan}
										class="max-w-[400px] px-5 text-center font-bold"
									>
										{#if !header.isPlaceholder}
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body>
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-state={row.getIsSelected() && "selected"}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell class="max-w-[400px] px-5 py-2 text-center">
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									No results.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>

		<div class="mt-2 flex items-center justify-between space-x-4">
			<div class="sum-tainer flex items-center justify-between">
				<p class="text-sm opacity-70">
					<strong>Total:</strong> <span class="num">{numParse(filteredPosts.length)}</span>
				</p>
			</div>

			<div class="flex flex-row items-center justify-end">
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					><ChevronLeft class="mr-2 h-4 w-4" />Previous</Button
				>
				<Button class="mx-2" variant="outline" size="sm" disabled={true}
					>{pagination.pageIndex + 1}</Button
				>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}>Next<ChevronRight class="ml-2 h-4 w-4" /></Button
				>
			</div>
		</div>
	</div>
{/if}

<AnySheet
	{openTrigger}
	{forceClose}
	title="Add a Post"
	description="Add analytics to the Odyn Space!"
>
	{#snippet main()}
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="text-right">Date</Label>
			<DatePicker handler={updateDate} reset={resetDatePicker} />
		</div>

		<div class="mt-6 flex w-full max-w-sm flex-row gap-1.5">
			<Label class="text-right">Time</Label>
			<AnyPicker data={hourArray} handler={updateHour} pickerTitle="Hour" value={hourValue} />
			<AnyPicker
				data={minuteArray}
				handler={updateMinute}
				pickerTitle="Minute"
				value={minuteValue}
			/>
		</div>

		<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
			<Label class="text-right">Platform</Label>
			<AnyPicker
				data={[
					{ label: "Facebook", value: "Facebook" },
					{ label: "LinkedIn", value: "LinkedIn" },
					{ label: "YouTube", value: "YouTube" },
					{ label: "Spotify", value: "Spotify" },
				]}
				handler={updatePlatform}
				pickerTitle="Platform"
				value={platformValue}
			/>
		</div>

		<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
			<Label class="text-right">{labelsObj[platformValue][0]}</Label>
			<Input
				bind:value={udf1Val}
				class="col-span-3"
				oninput={() => {
					udf1Val = udf1Val.replace(/[^\d]/g, "");
				}}
			/>
		</div>

		{#if platformValue !== "Spotify"}
			<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
				<Label class="text-right">{labelsObj[platformValue][1]}</Label>
				<Input
					bind:value={udf2Val}
					class="col-span-3"
					oninput={() => {
						udf2Val = udf2Val.replace(/[^\d]/g, "");
					}}
				/>
			</div>
		{/if}

		{#if platformValue !== "Spotify"}
			<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
				<Label class="text-right">{labelsObj[platformValue][2]}</Label>
				<Input
					bind:value={udf3Val}
					class="col-span-3"
					oninput={() => {
						udf3Val = udf3Val.replace(/[^\d]/g, "");
					}}
				/>
			</div>
		{/if}

		{#if platformValue !== "Spotify"}
			<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
				<Label class="text-right">{labelsObj[platformValue][3]}</Label>
				<Input
					bind:value={udf4Val}
					class="col-span-3"
					oninput={() => {
						udf4Val = udf4Val.replace(/[^\d]/g, "");
					}}
				/>
			</div>
		{/if}

		{#if platformValue !== "YouTube"}
			<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
				<Label class="text-right">{labelsObj[platformValue][4]}</Label>
				<Input
					bind:value={udf5Val}
					class="col-span-3"
					oninput={() => {
						udf5Val = udf5Val.replace(/[^\d]/g, "");
					}}
				/>
			</div>
		{/if}
	{/snippet}

	{#snippet actionButton()}
		<Button disabled={loading} onclick={addPost}>Submit<Upload class="ml-2 h-4 w-4" /></Button>
	{/snippet}
</AnySheet>

<style lang="scss">
	.main-tainer {
		height: calc(100% - 55px);
	}

	.table-tainer {
		width: 100%;
		height: calc(98% - 38px);
		overflow-y: auto;
		position: relative;
	}

	.h-scroll {
		width: fit-content; // makes it as wide as the table needs
		min-width: 100%; // makes sure it stretches full width
		overflow-x: auto;
		overflow-y: hidden;
		position: sticky;
		bottom: 0;
	}

	/*
	.top-tainer {
		justify-content: space-between;
	}
    */
</style>
