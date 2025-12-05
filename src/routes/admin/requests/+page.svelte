<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet, tick } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import OrderActions from "./OrderActions.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";
	import Label from "$lib/components/ui/label/label.svelte";

	//icons
	import { Search, ChevronLeft, ChevronRight, Upload, Check, X } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponse, GenericResponseWData, SBZdb, Types } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

	type ClientRow = SBZdb["public"]["Tables"]["clients"]["Row"];

	let { data }: PageProps = $props();

	let requestData = $state<ClientRow[]>([]);
	let loading = $state<boolean>(false);
	let initialising = $state<boolean>(true);

	$effect(() => {
		data.requests
			.then((res) => {
				requestData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get clients! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	let openTrigger = $state<number>(0);
	let forceClose = $state<number>(0);

	const initClient: ClientRow = {
		acc_type: "individual",
		bank_acc_name: "",
		bank_acc_num: "",
		bank_name: "",
		branch_code: "",
		branch_name: "",
		broker_comission: 0,
		city: "",
		comp_directors: [],
		comp_managers: [],
		country: "",
		created_at: "",
		cv_num: "",
		dob: "",
		email: "",
		fname: "",
		gender: "",
		id_num: "",
		id_type: "",
		is_approved: false,
		is_in_trust_of: false,
		joint_partners: [],
		lname: "",
		luseId: -1,
		manag_city: "",
		manag_country: "",
		manag_dob: "",
		manag_email: "",
		manag_fname: "",
		manag_gender: "",
		manag_id_num: "",
		manag_id_type: "",
		manag_lname: "",
		manag_mstatus: "",
		manag_nationality: "",
		manag_phone: -1,
		manag_street: "",
		mstatus: "",
		nationality: "",
		phone: -1,
		referral_src: "",
		signatures: {},
		signing_arrangement: 0,
		street: "",
		swift_code: "",
		approve_date: "",
		approved_by: "",
	};

	let activeRow = $state<ClientRow>(initClient);
	let sheetWidth = $state<number | undefined>(undefined);

	let sheetTitle = $state<string>("");
	let sheetDesc = $state<string>("");

	let udf1 = $state<string>("");

	const resetSheet = () => {
		udf1 = "";
	};

	const openSheet = (row: ClientRow, width?: number) => {
		resetSheet();

		activeRow = row;
		sheetWidth = width;

		openTrigger = Date.now();
	};

	const closeSheet = () => {
		forceClose = Date.now();
	};

	const columns: ColumnDef<ClientRow>[] = [
		{
			id: "actions",
			cell: ({ row }) =>
				renderComponent(OrderActions, {
					data: row.original,
					openSheet,
					permissions: data.perimissions,
				}),
		},
		{
			id: "names",
			header: "Names",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = row.original;
					return {
						render: () => `${value.fname} ${value.lname}`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "nationality",
			header: "Nationality",
		},
		{
			id: "age",
			header: "Status",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as boolean;
					return {
						render: () =>
							value ? `<span class="gren">Active</span>` : `<span class="rd">Blocked</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			id: "acc_type",
			header: "Account Type",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = row.original;
					return {
						render: () => (value.is_in_trust_of ? "In Trust Of" : toTitleCase(value.acc_type)),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "created_at",
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

	type StrongFilter = "none" | "active" | "blocked" | "ticketable" | "non-ticketable";

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleanedClientsList = $derived.by(() => {
		switch (strongFilter) {
			default:
				return requestData;
		}
	});

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filteredClients = $derived.by(() => {
		return cleanedClientsList.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));
			const _compareTwo = (value: string) =>
				_sanitize(entry.is_in_trust_of ? "intrustof" : value).includes(
					_sanitize(globalFilterValue),
				);

			if (_compare(formatDbTime(entry.created_at))) res = true;
			if (_compare(entry.fname)) res = true;
			if (_compare(entry.lname)) res = true;
			if (_compare(entry.nationality)) res = true;
			if (_compareTwo(entry.acc_type)) res = true;

			return res;
		});
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return filteredClients;
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

	const removeClient = async (member: ClientRow) => {
		const temp: ClientRow[] = JSON.parse(JSON.stringify(requestData));

		const index = temp.findIndex((item) => item.id_num === member.id_num);

		temp.splice(index, 1);

		requestData = temp;

		await tick();

		closeSheet();
	};

	const approveMember = async () => {
		loading = true;
		toast.info("Approving client...");

		try {
			const req = await fetch("/api/admin/requests", {
				method: "POST",
				body: JSON.stringify({
					action: "approve",
					obj: {
						idNum: activeRow.id_num,
						luseId: activeRow.luseId.toString(),
						fname: activeRow.fname,
						email: activeRow.email,
					},
				}),
			});

			const res: GenericResponse = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			if (res.success) {
				removeClient(activeRow);
			}
		} catch (ex: any) {
			loading = false;
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(String(ex));
		}
	};

	const rejectMember = async () => {
		loading = true;
		toast.info("Rejecting client...");

		try {
			const req = await fetch("/api/admin/requests", {
				method: "POST",
				body: JSON.stringify({
					action: "reject",
					obj: {
						idNum: activeRow.id_num,
						luseId: activeRow.luseId.toString(),
						fname: activeRow.fname,
						email: activeRow.email,
						reason: udf1.trim(),
					},
				}),
			});

			const res: GenericResponse = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			if (res.success) {
				removeClient(activeRow);
			}
		} catch (ex: any) {
			loading = false;
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(String(ex));
		}
	};
</script>

<Head
	title="Requests | SBZ Admin"
	ogTitle="Requests"
	description="Manage user access."
	ogDescription="Manage user access."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Requests</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Requests..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Requests</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Requests..." type="text" disabled />
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
{:else if !requestData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Requests</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Requests..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Staff</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Requests..." type="text" disabled />
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
		<h1>Requests</h1>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter Requests..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Requests</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Requests..."
				type="text"
			/>
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
					<strong>Total:</strong> <span class="num">{numParse(filteredClients.length)}</span>
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

	<AnySheet
		{openTrigger}
		{forceClose}
		width={sheetWidth}
		title={sheetTitle}
		description={"The client will be informed of your action, however, they will not know who did it."}
	>
		{#snippet main()}
			<div class="flex w-full max-w-sm flex-col gap-1.5">
				<table></table>
				<p class="text-justify text-sm text-muted-foreground">This cannot be changed later.</p>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button variant="destructive" disabled={loading} onclick={rejectMember}
				>Reject<X class="ml-2 h-4 w-4" /></Button
			>
			<Button disabled={loading} onclick={approveMember}
				>Approve<Check class="ml-2 h-4 w-4" /></Button
			>
		{/snippet}
	</AnySheet>
{/if}

<style lang="scss">
	.main-tainer {
		height: calc(100% - 85px);
		width: 100%;
	}
	.table-tainer {
		width: 100%;
		height: calc(100% - 13px);
		overflow-y: auto;
		position: relative;

		&::-webkit-scrollbar-thumb {
			border-radius: 100px !important;
		}
	}

	.h-scroll {
		width: fit-content; // makes it as wide as the table needs
		min-width: 100%; // makes sure it stretches full width
		overflow-x: auto;
		overflow-y: hidden;
		position: sticky;
		bottom: 0;

		&::-webkit-scrollbar-thumb {
			border-radius: 100px !important;
		}
	}

	.sum-tainer {
		max-width: calc(100% - 220px);
		overflow-x: auto;

		&::-webkit-scrollbar {
			display: none;
		}

		p {
			white-space: nowrap;
		}
	}
</style>
