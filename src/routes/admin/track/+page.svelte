<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime } from "$lib/utils";
	import { createRawSnippet, onMount, tick } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import OrderActions from "./TrackActions.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Table from "$lib/components/ui/table/index";
	import Label from "$lib/components/ui/label/label.svelte";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";

	//icons
	import { Search, ChevronLeft, ChevronRight, Check, X, Eye, PlusCircle } from "@lucide/svelte";

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
		opened_by: "",
		wallet_details: {},
		id_num_og: "",
	};

	let activeRow = $state<ClientRow>(initClient);

	let sheetTitle = $state<string>("");

	let udf1 = $state<string>("");

	let kycLoading = $state<boolean>(false);
	let kycLoadingMng = $state<boolean>(false);
	let kycDocs = $state<Types["ClientKyc"][] | undefined>(undefined);
	type KycDocsMng = { [key: string]: Types["ClientKyc"][] };
	let kycDocsMng = $state<KycDocsMng>({});

	const resetSheet = () => {
		udf1 = "";
		kycLoading = false;
		kycDocs = undefined;
	};

	const getDocs = async (id?: string) => {
		kycLoading = true;

		const _id = id ? id : activeRow.id_num_og;

		try {
			const req = await fetch("/api/admin/requests", {
				method: "POST",
				body: JSON.stringify({ action: "kyc", obj: { idNum: _id } }),
			});

			const { data, message, success }: GenericResponseWData<Types["ClientKyc"][]> =
				await req.json();

			if (!success) {
				toast.error(message);
				return;
			}

			kycDocs = data;
			await tick();
			kycLoading = false;
		} catch (ex: any) {
			toast.error(String(ex));
		}
	};

	const getDocsOther = async (id?: string) => {
		const _id = id ? id : activeRow.id_num_og;

		if (kycDocsMng[_id]) return;

		kycLoadingMng = true;

		try {
			const req = await fetch("/api/admin/requests", {
				method: "POST",
				body: JSON.stringify({ action: "kyc", obj: { idNum: _id } }),
			});

			const { data, message, success }: GenericResponseWData<Types["ClientKyc"][]> =
				await req.json();

			if (!success) {
				toast.error(message);
				return;
			}

			const temp: KycDocsMng = JSON.parse(JSON.stringify(kycDocsMng));

			temp[_id] = data;

			kycDocsMng = temp;

			await tick();
			kycLoadingMng = false;
		} catch (ex: any) {
			toast.error(String(ex));
		}
	};

	const openDoc = (cfg: "poa" | "poi" | "selfie" | "aco") => {
		let expndedCfg = "";

		switch (cfg) {
			case "poa":
				expndedCfg = "proof of address";
				break;
			case "poi":
				expndedCfg = "proof of identity";
				break;
			case "selfie":
				expndedCfg = "selfie";
				break;
			case "aco":
				expndedCfg = "account opening form";
				break;
			default:
				expndedCfg = "unkown";
		}

		if (kycDocs) {
			const doc = kycDocs.find((item) => item.title.includes(toTitleCase(expndedCfg)));

			if (!doc) {
				toast.error(`No '${expndedCfg}' provided!`);
				return;
			}

			window.open(doc.url, "pdfWindow", "width=600,height=800,menubar=no,toolbar=no,location=no");
		}
	};

	const openDocMng = async (cfg: "poa" | "poi" | "selfie" | "aco", idNum: string) => {
		try {
			await getDocsOther(idNum);
			let expndedCfg = "";

			switch (cfg) {
				case "poa":
					expndedCfg = "proof of address";
					break;
				case "poi":
					expndedCfg = "proof of identity";
					break;
				case "selfie":
					expndedCfg = "selfie";
					break;
				case "aco":
					expndedCfg = "account opening form";
					break;
				default:
					expndedCfg = "unkown";
			}

			// console.log(kycDocsMng);

			if (kycDocsMng) {
				const doc = kycDocsMng[idNum].find((item) => item.title.includes(toTitleCase(expndedCfg)));

				if (!doc) {
					toast.error(`No '${expndedCfg}' provided!`);
					return;
				}

				window.open(doc.url, "pdfWindow", "width=600,height=800,menubar=no,toolbar=no,location=no");
			} else {
				toast.error(`Failed to get docs!`);
				return;
			}
		} catch (ex: any) {}
	};

	const openSheet = (row: ClientRow, width?: number) => {
		resetSheet();

		activeRow = row;
		getDocs();
		// console.log({ requestData });
		// activeRow = requestData[0];
		sheetTitle = `${row.fname}'s File`;
		// isRejection = false;

		openTrigger = Date.now();
	};

	const closeSheet = () => {
		forceClose = Date.now();
	};

	const columns: ColumnDef<ClientRow>[] = [
		{
			id: "status",
			cell: ({ row }) => {
				// console.log({ row, p: "status" });
				const renderCell = createRawSnippet<[string]>(() => {
					const value = row.original.cv_num !== "";
					return {
						render: () => `<span class="onl-status ${value ? "onl" : "ofl"}"></span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
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
			accessorKey: "luseId",
			header: "LuSE ID",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as number;
					return {
						render: () => `<span class="num">${value > -1 ? value : "-"}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},

		{
			accessorKey: "cv_num",
			header: "CV",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as string;
					return {
						render: () => `<span class="num">${value}</span>`,
					};
				});

				return renderSnippet(renderCell);
			},
		},
		{
			id: "names",
			header: "Names",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = row.original;
					return {
						render: () => `<span class="whitespace-normal">${value.fname} ${value.lname}</span>`,
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
			header: "Age",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const dNow = new Date();
					const dobClient = new Date(row.original.dob);

					const age = dNow.getFullYear() - dobClient.getFullYear();

					return {
						render: () => `<span class="num">${age.toString()}</span>`,
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
		{
			accessorKey: "approve_date",
			header: "Date Approved",
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
			id: "approved_by",
			header: "Approver",
			cell: ({ row }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = row.original.approved_by.length
						? toTitleCase(row.original.approved_by)
						: "<span></span>";
					return {
						render: () => value,
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
</script>

<Head
	title="Track | SBZ Admin"
	ogTitle="Track"
	description="Monitor the recent account openings."
	ogDescription="Monitor the recent account openings."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Waiting Room</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Waiting Room..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Waiting Room</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Waiting Room..." type="text" disabled />
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
			<h1>Waiting Room</h1>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Waiting Room..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Waiting Room</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Waiting Room..." type="text" disabled />
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
		<h1>Waiting Room</h1>
	</div>
	<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
		<Search class="mr-4" />
		<Input class="w-[100%]" placeholder="Filter Waiting Room..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Waiting Room</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Waiting Room..."
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
		width={undefined}
		big={true}
		title={sheetTitle}
		description={"The client will be informed of your action, however, they will not know who did it."}
	>
		{#snippet main()}
			<div class="flex w-full max-w-sm flex-col gap-1.5">
				{#if activeRow.acc_type === "individual"}
					{#if kycDocs && kycDocs.find((item) => item.title.toLowerCase() === "account opening form")}
						<Button variant="outline" onclick={() => openDoc("aco")}
							>View Account Opening Form<Eye class="h-4 w-4" /></Button
						>
					{/if}

					<Label class="mt-5">Client Details</Label>
					<table class="data-table">
						<tbody>
							<tr>
								<td>F. Name</td>
								<td>O. Names</td>
								<td>Phone</td>
								<td>Email</td>
								<td>D.O.B</td>
							</tr>
							<tr>
								<td>{activeRow.fname}</td>
								<td>{activeRow.lname}</td>
								<td class="num">{activeRow.phone}</td>
								<td>{activeRow.email}</td>
								<td class="num">{formatDbTime(activeRow.dob, true)}</td>
							</tr>

							<tr>
								<td>Gender</td>
								<td>M. Status</td>
								<td>Nationality</td>
								<td
									rowspan="2"
									colspan="2"
									style="background-color: var(--background); border-right: 0px solid transparent;"
									><Button
										class="ml-6"
										variant="outline"
										disabled={kycLoading}
										onclick={() => openDoc("selfie")}>View Selfie<Eye class="h-4 w-4" /></Button
									></td
								>
							</tr>
							<tr>
								<td>{activeRow.gender}</td>
								<td class="num">{activeRow.mstatus}</td>
								<td>{activeRow.nationality}</td>
							</tr>
						</tbody>
					</table>

					<Label class="mt-5">Client Address</Label>
					<table class="data-table">
						<tbody>
							<tr>
								<td colspan="2">Street</td>
								<td
									rowspan="4"
									style="background-color: var(--background); border-right: 0px solid transparent;"
									><Button
										class="ml-6"
										variant="outline"
										disabled={kycLoading}
										onclick={() => openDoc("poa")}
										>View Proof of Address<Eye class="h-4 w-4" /></Button
									></td
								>
							</tr>
							<tr>
								<td colspan="2" class="whitespace-normal">{activeRow.street}</td>
							</tr>

							<tr>
								<td>City</td>
								<td style="border-right: 0px solid transparent;">Country</td>
							</tr>
							<tr>
								<td>{activeRow.city}</td>
								<td style="border-right: 0px solid transparent;">{activeRow.country}</td>
							</tr>
						</tbody>
					</table>

					<Label class="mt-5">Client Identity</Label>
					<table class="data-table">
						<tbody>
							<tr>
								<td>ID Type</td>
								<td style="border-right: 0px solid transparent;">ID Number</td>
								<td
									rowspan="2"
									style="background-color: var(--background); border-right: 0px solid transparent;"
									><Button
										class="ml-6"
										variant="outline"
										disabled={kycLoading}
										onclick={() => openDoc("poi")}
										>View Proof of Identity<Eye class="h-4 w-4" /></Button
									></td
								>
							</tr>
							<tr>
								<td>{activeRow.id_type}</td>
								<td style="border-right: 0px solid transparent;">{activeRow.id_num_og}</td>
							</tr>
						</tbody>
					</table>

					{#if activeRow.is_in_trust_of}
						<Label>Manager Details</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>F. Name</td>
									<td>O. Names</td>
									<td>Phone</td>
									<td>Email</td>
									<td>D.O.B</td>
								</tr>
								<tr>
									<td>{activeRow.manag_fname}</td>
									<td>{activeRow.manag_lname}</td>
									<td class="num">{activeRow.manag_phone}</td>
									<td>{activeRow.manag_email}</td>
									<td class="num">{formatDbTime(activeRow.manag_dob, true)}</td>
								</tr>

								<tr>
									<td>Gender</td>
									<td>M. Status</td>
									<td>Nationality</td>
									<td
										rowspan="2"
										colspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("selfie", activeRow.manag_id_num)}
											>View Selfie<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{activeRow.manag_gender}</td>
									<td class="num">{activeRow.manag_mstatus}</td>
									<td>{activeRow.manag_nationality}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">Manager Address</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td colspan="2">Street</td>
									<td
										rowspan="4"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poa", activeRow.manag_id_num)}
											>View Proof of Address<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td colspan="2" class="whitespace-normal">{activeRow.manag_street}</td>
								</tr>

								<tr>
									<td>City</td>
									<td style="border-right: 0px solid transparent;">Country</td>
								</tr>
								<tr>
									<td>{activeRow.manag_city}</td>
									<td style="border-right: 0px solid transparent;">{activeRow.manag_country}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">Manager Identity</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>ID Type</td>
									<td style="border-right: 0px solid transparent;">ID Number</td>
									<td
										rowspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poi", activeRow.manag_id_num)}
											>View Proof of Identity<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{activeRow.manag_id_type}</td>
									<td style="border-right: 0px solid transparent;">{activeRow.manag_id_num}</td>
								</tr>
							</tbody>
						</table>
					{/if}
				{/if}

				{#if activeRow.acc_type === "joint"}
					{#each activeRow.joint_partners as any[] as Types["PartnerObj"][] as entry}
						{#if kycDocsMng[entry.idNum] && kycDocsMng[entry.idNum].find((item) => item.title.toLowerCase() === "account opening form")}
							<Button variant="outline" class="mb-5" onclick={() => openDoc("aco")}
								>View Account Opening Form<Eye class="h-4 w-4" /></Button
							>
						{/if}

						<Label>{entry.fname} Details</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>F. Name</td>
									<td>O. Names</td>
									<td>Phone</td>
									<td>Email</td>
									<td>D.O.B</td>
								</tr>
								<tr>
									<td>{entry.fname}</td>
									<td>{entry.lname}</td>
									<td class="num">{entry.phone}</td>
									<td>{entry.email}</td>
									<td class="num">{formatDbTime(entry.dob, true)}</td>
								</tr>

								<tr>
									<td>Gender</td>
									<td>M. Status</td>
									<td>Nationality</td>
									<td
										rowspan="2"
										colspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("selfie", entry.idNum)}
											>View Selfie<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.gender}</td>
									<td class="num">{entry.mstatus}</td>
									<td>{entry.nationality}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">{entry.fname} Address</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td colspan="2">Street</td>
									<td
										rowspan="4"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poa", entry.idNum)}
											>View Proof of Address<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td colspan="2" class="whitespace-normal">{entry.street}</td>
								</tr>

								<tr>
									<td>City</td>
									<td style="border-right: 0px solid transparent;">Country</td>
								</tr>
								<tr>
									<td>{entry.city}</td>
									<td style="border-right: 0px solid transparent;">{entry.country}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">{entry.fname} Identity</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>ID Type</td>
									<td style="border-right: 0px solid transparent;">ID Number</td>
									<td
										rowspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poi", entry.idNum)}
											>View Proof of Identity<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.idType}</td>
									<td style="border-right: 0px solid transparent;">{entry.idNum}</td>
								</tr>
							</tbody>
						</table>
					{/each}
				{/if}

				{#if activeRow.acc_type === "institution"}
					{#each activeRow.comp_directors as any[] as Types["PartnerObj"][] as entry}
						<Label>D - {entry.fname} Details</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>F. Name</td>
									<td>O. Names</td>
									<td>Phone</td>
									<td>Email</td>
									<td>D.O.B</td>
								</tr>
								<tr>
									<td>{entry.fname}</td>
									<td>{entry.lname}</td>
									<td class="num">{entry.phone}</td>
									<td>{entry.email}</td>
									<td class="num">{formatDbTime(entry.dob, true)}</td>
								</tr>

								<tr>
									<td>Gender</td>
									<td>M. Status</td>
									<td>Nationality</td>
									<td
										rowspan="2"
										colspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("selfie", entry.idNum)}
											>View Selfie<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.gender}</td>
									<td class="num">{entry.mstatus}</td>
									<td>{entry.nationality}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">D - {entry.fname} Address</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td colspan="2">Street</td>
									<td
										rowspan="4"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poa", entry.idNum)}
											>View Proof of Address<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td colspan="2" class="whitespace-normal">{entry.street}</td>
								</tr>

								<tr>
									<td>City</td>
									<td style="border-right: 0px solid transparent;">Country</td>
								</tr>
								<tr>
									<td>{entry.city}</td>
									<td style="border-right: 0px solid transparent;">{entry.country}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">D - {entry.fname} Identity</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>ID Type</td>
									<td style="border-right: 0px solid transparent;">ID Number</td>
									<td
										rowspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poi", entry.idNum)}
											>View Proof of Identity<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.idType}</td>
									<td style="border-right: 0px solid transparent;">{entry.idNum}</td>
								</tr>
							</tbody>
						</table>
					{/each}
					<!-- END DIRECTORS -->
					{#each activeRow.comp_directors as any[] as Types["PartnerObj"][] as entry}
						<Label>M - {entry.fname} Details</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>F. Name</td>
									<td>O. Names</td>
									<td>Phone</td>
									<td>Email</td>
									<td>D.O.B</td>
								</tr>
								<tr>
									<td>{entry.fname}</td>
									<td>{entry.lname}</td>
									<td class="num">{entry.phone}</td>
									<td>{entry.email}</td>
									<td class="num">{formatDbTime(entry.dob, true)}</td>
								</tr>

								<tr>
									<td>Gender</td>
									<td>M. Status</td>
									<td>Nationality</td>
									<td
										rowspan="2"
										colspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("selfie", entry.idNum)}
											>View Selfie<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.gender}</td>
									<td class="num">{entry.mstatus}</td>
									<td>{entry.nationality}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">M - {entry.fname} Address</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td colspan="2">Street</td>
									<td
										rowspan="4"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poa", entry.idNum)}
											>View Proof of Address<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td colspan="2" class="whitespace-normal">{entry.street}</td>
								</tr>

								<tr>
									<td>City</td>
									<td style="border-right: 0px solid transparent;">Country</td>
								</tr>
								<tr>
									<td>{entry.city}</td>
									<td style="border-right: 0px solid transparent;">{entry.country}</td>
								</tr>
							</tbody>
						</table>

						<Label class="mt-5">M - {entry.fname} Identity</Label>
						<table class="data-table">
							<tbody>
								<tr>
									<td>ID Type</td>
									<td style="border-right: 0px solid transparent;">ID Number</td>
									<td
										rowspan="2"
										style="background-color: var(--background); border-right: 0px solid transparent;"
										><Button
											class="ml-6"
											variant="outline"
											disabled={kycLoadingMng}
											onclick={() => openDocMng("poi", entry.idNum)}
											>View Proof of Identity<Eye class="h-4 w-4" /></Button
										></td
									>
								</tr>
								<tr>
									<td>{entry.idType}</td>
									<td style="border-right: 0px solid transparent;">{entry.idNum}</td>
								</tr>
							</tbody>
						</table>
					{/each}
					<!-- END MANAGERS -->
				{/if}

				<Label class="mt-5">Client Banking</Label>
				<table class="data-table">
					<tbody>
						<tr>
							<td>Bank Name</td>
							<td>Bank Acc. Name</td>
							<td>Bank Acc. No.</td>
						</tr>
						<tr>
							<td>{activeRow.bank_name}</td>
							<td>{activeRow.bank_acc_name}</td>
							<td>{activeRow.bank_acc_num}</td>
						</tr>

						<tr>
							<td>Branch Name</td>
							<td>Branch Code</td>
							<td>Swift Code</td>
						</tr>
						<tr>
							<td>{activeRow.branch_name}</td>
							<td>{activeRow.branch_code}</td>
							<td>{activeRow.swift_code}</td>
						</tr>
					</tbody>
				</table>

				<Label class="mt-5">Questionnaire</Label>
				<table class="data-table">
					<tbody>
						<tr>
							<td>Where Did You Hear About SBZ?</td>
						</tr>
						<tr>
							<td>{activeRow.referral_src}</td>
						</tr>

						<tr>
							<td>Signing Arrangement</td>
						</tr>
						<tr>
							<td class="num">{activeRow.signing_arrangement}</td>
						</tr>
					</tbody>
				</table>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<span></span>
		{/snippet}
	</AnySheet>
{/if}

<style lang="scss">
	.data-table {
		// border: 1px solid red;
		max-width: 100%;
		white-space: nowrap;
		text-align: center;
		table-layout: auto;

		tr:nth-child(odd) {
			background-color: var(--shadow);
		}

		tr td:nth-child(2) {
			border-right: 1px solid var(--foreground);
		}

		tr td:nth-child(4) {
			border-right: 1px solid var(--foreground);
		}

		td {
			min-width: 200px;
			padding: 0px 5px;
		}
	}

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
