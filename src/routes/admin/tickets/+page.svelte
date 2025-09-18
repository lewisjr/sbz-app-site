<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";
	import {
		percentageHandler,
		queryTypesArray,
		platformsArray,
		referralSourcesArray,
	} from "$lib/utils";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import TicketActions from "./TicketActions.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";
	import Label from "$lib/components/ui/label/label.svelte";

	//icons
	import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Upload } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { SBZdb, Types } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";

	let { data }: PageProps = $props();

	type TicketRow = SBZdb["public"]["Tables"]["odyn-tickets"]["Row"];

	let ticketData = $state<TicketRow[]>([]);
	let loading = $state<boolean>(false);
	let initialising = $state<boolean>(true);

	$effect(() => {
		data.tickets
			.then((res) => {
				ticketData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get tickets! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	type ActionConfig = Types["ActionConfig"];

	let openTrigger = $state<number>(0);
	let forceClose = $state<number>(0);
	let sheetConfig = $state<ActionConfig>("re-assign");

	const initTicket: TicketRow = {
		assigned: "",
		created_at: "",
		email: "",
		id: "",
		id_num: "",
		is_closed: false,
		luse_id: 0,
		names: "",
		object: null,
		phone: "",
		platform: "",
		query: "",
		query_type: "",
		referral_source: "",
		uid: "",
		close_date: null,
	};

	let activeRow = $state<TicketRow>(initTicket);
	let sheetWidth = $state<number | undefined>(undefined);

	let sheetTitle = $state<string>("");
	let sheetDesc = $state<string>("");

	// udp = user defined picker
	// udf = user defined field
	let udp1 = $state<string>("");
	const changeUdp1 = (val: string) => (udp1 = val);

	let udf1 = $state<string>("");

	const resetSheet = () => {
		changeUdp1("");
		udf1 = "";
	};

	const openSheet = (config: ActionConfig, row: TicketRow, width?: number) => {
		resetSheet();

		sheetConfig = config;
		activeRow = row;
		sheetWidth = width;

		switch (config) {
			case "re-assign":
				sheetTitle = `Reassign ${row.names}'s Ticket`;
				sheetDesc = `The current broker responsible for this ticket (${row.id}) is ${toTitleCase(row.assigned)}.`;
				break;
			default:
				sheetTitle = "Error";
				sheetDesc = "This should not be possible.";
				break;
		}

		openTrigger = Date.now();
	};

	const closeSheet = () => {
		forceClose = Date.now();
	};

	const columns: ColumnDef<TicketRow>[] = [
		{
			accessorKey: "id",
			header: "Ticket No.",
		},
		{
			accessorKey: "created_at",
			header: "Lodged",
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
		{
			accessorKey: "assigned",
			header: "Assignee",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => toTitleCase(value),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "is_closed",
			header: "Status",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue();
					return {
						render: () =>
							value ? `<span class="gren">Closed</span>` : `<span class="rd">Open</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
			enableColumnFilter: false,
		},
		{
			accessorKey: "close_date",
			header: "Date Closed",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string | null;
					return {
						render: () => (value ? formatDbTime(value) : "-"),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "query_type",
			header: "Type",
		},
		{
			accessorKey: "query",
			header: "Details",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<p class="w-[400px] whitespace-normal">${value}</p>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "luse_id",
			header: "LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => (value === -1 ? "-" : value.toString()),
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			accessorKey: "names",
			header: "Names",
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "phone",
			header: "Phone No.",
		},
		{
			accessorKey: "platform",
			header: "Platform",
		},
		{
			accessorKey: "referral_source",
			header: "Referrer",
		},
		{
			id: "actions",
			cell: ({ row }) =>
				renderComponent(TicketActions, {
					data: row.original,
					openSheet,
				}),
		},
	];

	type StrongFilter =
		| "none"
		| "closed"
		| "open"
		| Types["ReferralSource"]
		| Types["QueryTypes"]
		| Types["Platforms"]
		| string;

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleanedTickets = $derived.by(() => {
		switch (strongFilter) {
			case "none":
				return ticketData;
			case "agent":
				const agentTickets = ticketData.filter((item) => item.assigned === data.admin);
				return agentTickets;
			case "closed":
				const closeddTickets = ticketData.filter((item) => item.is_closed);
				return closeddTickets;
			case "open":
				const openTickets = ticketData.filter((item) => !item.is_closed);
				return openTickets;
			default:
				const [code, filter] = strongFilter.split(":");

				if (code === "AG") {
					const agentTickets = ticketData.filter((item) => item.assigned === filter);
					return agentTickets;
				}

				if (code === "RS") {
					const referralTickets = ticketData.filter((item) => item.referral_source === filter);
					return referralTickets;
				}

				if (code === "QT") {
					const qTypeTickets = ticketData.filter((item) => item.query_type === filter);
					return qTypeTickets;
				}

				if (code === "P") {
					const platformTickets = ticketData.filter((item) => item.platform === filter);
					return platformTickets;
				}

				return ticketData;
		}
	});

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filteredTickets = $derived.by(() => {
		return cleanedTickets.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));

			if (_compare(entry.assigned)) res = true;
			if (entry.close_date && _compare(formatDbTime(entry.close_date))) res = true;
			if (_compare(formatDbTime(entry.created_at))) res = true;
			if (_compare(entry.email)) res = true;
			if (_compare(entry.id)) res = true;
			if (_compare(entry.id_num)) res = true;
			if (_compare(entry.luse_id.toString())) res = true;
			if (_compare(entry.names)) res = true;
			if (_compare(entry.phone)) res = true;
			if (_compare(entry.platform)) res = true;
			if (_compare(entry.query)) res = true;

			return res;
		});
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return filteredTickets;
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

	interface Summary {
		total: number;
		open: number;
		closed: number;
		efficiency: number;
		verdict: string;
		mostPopularQuery: string;
		mostPopularPlatform: string;
		mostPopularReferrer: string;
	}

	let summary: Summary = $derived.by(() => {
		let total: number = 0;
		let open: number = 0;
		let closed: number = 0;

		const qTypes: { [key: string]: number } = {};
		const platforms: { [key: string]: number } = {};
		const referrers: { [key: string]: number } = {};

		filteredTickets.forEach((row) => {
			total++;

			if (row.is_closed) closed++;
			else open++;

			qTypes[row.query_type]
				? (qTypes[row.query_type] = qTypes[row.query_type] + 1)
				: (qTypes[row.query_type] = 1);

			platforms[row.platform]
				? (platforms[row.platform] = platforms[row.platform] + 1)
				: (platforms[row.platform] = 1);

			referrers[row.referral_source]
				? (referrers[row.referral_source] = referrers[row.referral_source] + 1)
				: (referrers[row.referral_source] = 1);
		});

		// most popular query type
		let mPq: number = 0;
		let mPqText: string = "";

		Object.keys(qTypes).forEach((tipo) => {
			const count = qTypes[tipo];

			if (count > mPq) {
				mPqText = `${tipo} (${percentageHandler(count / total)})`;
			}

			mPq = count;
		});

		// most popular platform
		let mPpl: number = 0;
		let mPplText: string = "";

		Object.keys(platforms).forEach((platform) => {
			const count = platforms[platform];

			if (count > mPpl) {
				mPplText = `${platform} (${percentageHandler(count / total)})`;
			}

			mPpl = count;
		});

		// most popular referrer
		let mPr: number = 0;
		let mPrText: string = "";

		Object.keys(referrers).forEach((referrer) => {
			const count = referrers[referrer];

			if (count > mPr) {
				mPrText = `${referrer} (${percentageHandler(count / total)})`;
			}

			mPr = count;
		});

		const efficiency = closed / total;
		const verdict =
			efficiency < 0.5 ? "BAD" : efficiency < 0.7 ? "FAIR" : efficiency < 0.9 ? "GOOD" : "SUPERB";

		return {
			closed,
			efficiency,
			open,
			total,
			verdict,
			mostPopularQuery: mPqText,
			mostPopularPlatform: mPplText,
			mostPopularReferrer: mPrText,
		};
	});

	let brokerList = $derived.by(() => {
		const flattened = data.agents.map((broker) => broker.username);

		const selfIndex = flattened.indexOf(data.admin);
		const assignedIndex = flattened.indexOf(activeRow.assigned);

		flattened.splice(selfIndex, 1);
		flattened.splice(assignedIndex, 1);

		return flattened.map((broker) => {
			return { label: toTitleCase(broker), value: broker };
		});
	});

	const updateTicket = (ticket: TicketRow) => {
		const temp: TicketRow[] = JSON.parse(JSON.stringify(ticketData));

		const index = temp.findIndex((item) => (item.id = ticket.id));

		temp[index].assigned = ticket.assigned;

		ticketData = temp;

		closeSheet();
	};

	const reassignTicket = async () => {
		const fail = !udp1.length || udf1.length < 10;

		if (fail) {
			toast.error("One or both of the required data is malformed or missing.");
			return;
		}

		loading = true;
		toast.info("Reassigning ticket...");

		try {
			const req = await fetch("/api/admin/tickets", {
				method: "POST",
				body: JSON.stringify({
					action: "reassign",
					obj: {
						old: activeRow.assigned,
						new: udp1,
						ticketId: activeRow.id,
						clientEmail: activeRow.email,
						clientName: activeRow.names.split(" ")[0],
						queryType: activeRow.query_type,
						message: udf1,
					},
				}),
			});

			const res: { success: boolean; message: string } = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			const updatedTicket: TicketRow = JSON.parse(JSON.stringify(activeRow));
			updatedTicket.assigned = udp1;
			updateTicket(updatedTicket);
		} catch (ex: any) {
			loading = false;
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
		}
	};
</script>

<Head
	title="Tickets | SBZ Admin"
	ogTitle="Tickets"
	description="Fully managed customer service, for any and all scenarios."
	ogDescription="Fully managed customer service, for any and all scenarios."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
					data={{
						grouped: [],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
					loader
					disabled
				/>
			</div>
		</div>

		<div class="main-tainer">
			<div class="table-tainer loading mt-3 flex items-center rounded-md border"></div>

			<div class="mt-2 flex items-center justify-between space-x-4">
				<div class="flex items-center justify-between">
					<p class="loading no-padding text-sm opacity-70">
						<strong>Total:</strong> <span class="num">9,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Open:</strong> <span class="num">9,999</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Efficiency:</strong>
						<span class="num">100.00%</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>Verdict:</strong> <span class="num">SUPERB</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>TQ:</strong> <span class="num">Lorem (100.00%)</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>TP:</strong> <span class="num">Lorem (100.00%)</span>
					</p>
					<span class="mx-2 opacity-40">•</span>
					<p class="loading no-padding text-sm opacity-70">
						<strong>TR:</strong> <span class="num">Lorem (100.00%)</span>
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
{:else if !ticketData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<Button variant="secondary" class="ml-2" disabled
				>Filter By: {data.names.split(" ")[0]}<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Tickets</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" disabled />
				<AnyCombobox
					handler={updateStrongFilter}
					data={{
						grouped: [],
						ungrouped: [{ label: "None", value: "none" }],
					}}
					dataTitle="Filter"
					classes="ml-4"
					icon="filter"
				/>
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
		<h1>Tickets</h1>
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
		<Input class="w-[100%]" placeholder="Filter Tickets..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Tickets</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Tickets..."
				type="text"
			/>
			<AnyCombobox
				handler={updateStrongFilter}
				data={{
					grouped: [
						{
							title: "Asignee",
							group: data.agents.map((agent) => {
								const { username } = agent;
								return { label: toTitleCase(username), value: `AG:${username}` };
							}),
						},
						{
							title: "Status",
							group: [
								{ label: "Open", value: "open" },
								{ label: "Closed", value: "closed" },
							],
						},
						{
							title: "Type",
							group: queryTypesArray.map((item) => {
								const [_, val] = item.split(":");
								return { label: val, value: item };
							}),
						},
						{
							title: "Platform",
							group: platformsArray.map((item) => {
								const [_, val] = item.split(":");
								return { label: val, value: item };
							}),
						},
						{
							title: "Referrer",
							group: referralSourcesArray.map((item) => {
								const [_, val] = item.split(":");
								return { label: val, value: item };
							}),
						},
					],
					ungrouped: [{ label: "None", value: "none" }],
				}}
				dataTitle="Filter"
				classes="ml-4"
				icon="filter"
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
					<strong>Total:</strong> <span class="num">{numParse(summary.total)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Closed:</strong> <span class="num">{numParse(summary.closed)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Open:</strong> <span class="num">{numParse(summary.open)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Efficiency:</strong>
					<span class="num">{percentageHandler(summary.efficiency)}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="text-sm opacity-70">
					<strong>Verdict:</strong> <span class="num">{summary.verdict}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TQ:</strong> <span class="num">{summary.mostPopularQuery}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TP:</strong> <span class="num">{summary.mostPopularPlatform}</span>
				</p>
				<span class="mx-2 opacity-40">•</span>
				<p class="no-padding text-sm opacity-70">
					<strong>TR:</strong> <span class="num">{summary.mostPopularReferrer}</span>
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
		description={sheetDesc}
	>
		{#snippet main()}
			{#if sheetConfig === "re-assign"}
				<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
					<Label>Select A Different Broker</Label>
					<AnyCombobox
						handler={changeUdp1}
						data={{
							ungrouped: [],
							grouped: [
								{
									title: "Brokers",
									group: brokerList,
								},
							],
						}}
						dataTitle="Broker"
					/>
				</div>

				<div class="mt-8 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Reassignment Reason</Label>
					<Textarea
						bind:value={udf1}
						placeholder="E.g The previous assignee is out of office."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") reassignTicket();
						}}
						maxlength={120}
						class="h-[100px]"
					/>
					<p class="text-justify text-sm text-muted-foreground">
						This will be shown in the audit trail, and in an email to the client, and the trading
						desk.
					</p>
				</div>
			{/if}
		{/snippet}

		{#snippet actionButton()}
			{#if sheetConfig === "re-assign"}
				<Button disabled={!udp1.length || udf1.length < 10} onclick={reassignTicket}
					>Submit<Upload class="ml-2 h-4 w-4" /></Button
				>
			{/if}
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
