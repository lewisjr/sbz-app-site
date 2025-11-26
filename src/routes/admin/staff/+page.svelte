<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table/index";
	import { getCoreRowModel, getPaginationRowModel } from "@tanstack/table-core";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { numParse } from "@cerebrusinc/qol";
	import { formatDbTime, systemPermissions } from "$lib/utils";
	import { createRawSnippet, tick } from "svelte";
	import { renderSnippet, renderComponent } from "$lib/components/ui/data-table/index";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyCombobox from "$lib/components/AnyCombobox/AnyCombobox.svelte";
	import AnySheet from "$lib/components/AnySheet.svelte";
	import StaffActions from "./StaffActions.svelte";
	import MultiAnyPicker from "$lib/components/MultiAnyPicker.svelte";

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
		Lock,
		LockOpen,
		Pause,
		Play,
	} from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponseWData, SBZdb, Types } from "$lib/types";
	import type { ColumnDef, PaginationState } from "@tanstack/table-core";
	import AnyPicker from "$lib/components/AnyPicker.svelte";
	import isEmail from "is-email";

	type StaffRow = SBZdb["public"]["Tables"]["admins"]["Row"];

	let { data }: PageProps = $props();

	let staffData = $state<StaffRow[]>([]);
	let loading = $state<boolean>(false);
	let initialising = $state<boolean>(true);

	$effect(() => {
		data.staff
			.then((res) => {
				staffData = res;
				initialising = false;
			})
			.catch(() => {
				toast.error("Failed to get staff members! Please refresh the browser in a few minutes.");
				initialising = false;
			});
	});

	let isMobile = $derived($screenWidthStore < 767);

	type ActionConfig = Types["StaffActionConfig"];

	let openTrigger = $state<number>(0);
	let forceClose = $state<number>(0);
	let sheetConfig = $state<ActionConfig>("new");

	const initStaff: StaffRow = {
		approved: true,
		created_at: "",
		created_by: "",
		department: "",
		email: "",
		full_names: "",
		permissions: "",
		phone: "",
		ticketable: true,
		username: "",
	};

	let activeRow = $state<StaffRow>(initStaff);
	let sheetWidth = $state<number | undefined>(undefined);

	let sheetTitle = $state<string>("");
	let sheetDesc = $state<string>("");

	// udp = user defined picker
	// udf = user defined field
	let udp1 = $state<string>("");
	const changeUdp1 = (val: string) => (udp1 = val);

	let udf1 = $state<string>("");
	let udf2 = $state<string>("");
	let udf3 = $state<string>("");
	let udf4 = $state<string>("");
	let udf5 = $state<string>("");

	let newStaffDisabled = $derived.by(
		() =>
			udf1.length < 3 ||
			udf2.length < 3 ||
			udf3.length < 3 ||
			!isEmail(udf4) ||
			udf5.length < 8 ||
			!udp1.length,
	);

	const resetSheet = () => {
		changeUdp1("");
		udf1 = "";
		udf2 = "";
		udf3 = "";
		udf4 = "";
		udf5 = "";
	};

	const openSheet = (config: ActionConfig, row: StaffRow, width?: number) => {
		resetSheet();

		sheetConfig = config;
		activeRow = row;
		sheetWidth = width;

		switch (config) {
			case "block":
				sheetTitle = `Revoke ${toTitleCase(row.username)}'s Access`;
				sheetDesc = "This doesn't delete their account, but disables their ability to log in.";
				break;
			case "edit":
				sheetTitle = "Edit Details";
				sheetDesc = "Ensure the details are accurate and up to date.";
				break;
			case "perms":
				sheetTitle = "Edit Permissions";
				sheetDesc = "For these to reflect, they will need to sign out, then sign in again.";
				break;
			case "unblock":
				sheetTitle = `Reinstate ${toTitleCase(row.username)}'s Access`;
				sheetDesc = "They will be able to pick up right where they left off.";
				break;
			case "on-leave":
				sheetTitle = `Mark ${toTitleCase(row.username)} as On Leave`;
				sheetDesc = `This will pause Odyn from assigning tickets to ${toTitleCase(row.username)}.`;
				break;
			case "on-duty":
				sheetTitle = `Mark ${toTitleCase(row.username)} as On Duty`;
				sheetDesc = `This will enable Odyn to resume assigning tickets to ${toTitleCase(row.username)}.`;
				break;
			case "new":
				sheetTitle = `Add a Staff Member`;
				sheetDesc = "Ensure the details are accurate.";
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

	const columns: ColumnDef<StaffRow>[] = [
		{
			accessorKey: "username",
			header: "Username",
		},
		{
			accessorKey: "full_names",
			header: "Names",
		},
		{
			accessorKey: "approved",
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
			accessorKey: "department",
			header: "Department",
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "phone",
			header: "Phone",
		},
		{
			accessorKey: "ticketable",
			header: "Ticketable",
			cell: ({ cell }) => {
				const renderCell = createRawSnippet<[string]>(() => {
					const value = cell.getValue() as boolean;
					return {
						render: () => (value ? "Yes" : "No"),
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
			accessorKey: "created_by",
			header: "Added By",
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
			id: "actions",
			cell: ({ row }) =>
				renderComponent(StaffActions, {
					data: row.original,
					openSheet,
					permissions: data.perimissions,
				}),
		},
	];

	type StrongFilter = "none" | "active" | "blocked" | "ticketable" | "non-ticketable";

	let strongFilter = $state<StrongFilter>("none");
	const updateStrongFilter = (val: StrongFilter) => (strongFilter = val);

	let cleanedStaffList = $derived.by(() => {
		switch (strongFilter) {
			case "none":
				return staffData;
			case "active":
				const activeStaff = staffData.filter((item) => item.approved);
				return activeStaff;
			case "blocked":
				const inactiveStaff = staffData.filter((item) => !item.approved);
				return inactiveStaff;
			case "ticketable":
				const plebianStaff = staffData.filter((item) => item.ticketable);
				return plebianStaff;
			case "non-ticketable":
				const bossStaff = staffData.filter((item) => !item.ticketable);
				return bossStaff;
			default:
				return staffData;
		}
	});

	let globalFilterValue = $state<string>("");

	// ! could be a search error here
	let filteredStaff = $derived.by(() => {
		return cleanedStaffList.filter((entry) => {
			let res: boolean = false;

			const _sanitize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
			const _compare = (value: string) => _sanitize(value).includes(_sanitize(globalFilterValue));

			if (_compare(formatDbTime(entry.created_at))) res = true;
			if (_compare(entry.department)) res = true;
			if (_compare(entry.email)) res = true;
			if (_compare(entry.full_names)) res = true;
			if (_compare(entry.phone)) res = true;

			return res;
		});
	});

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const table = createSvelteTable({
		get data() {
			return filteredStaff;
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

	const appendMember = (member: StaffRow) => {
		const temp: StaffRow[] = JSON.parse(JSON.stringify(staffData));

		temp.push(member);

		temp.sort((a, b) => a.username.localeCompare(b.username));

		staffData = temp;

		closeSheet();
	};

	const updateMember = async (member: StaffRow) => {
		const temp: StaffRow[] = JSON.parse(JSON.stringify(staffData));

		const index = temp.findIndex((item) => item.username === member.username);

		temp[index] = member;

		staffData = temp;

		await tick();

		closeSheet();
	};

	let permisTemp = $state<string>("");
	let test = $state<string[]>([]);
	const permisHandler = (val: string) => {
		permisTemp = val;
	};

	// $effect(() => console.log({ permisTemp, time: Date.now() }));

	const addStaff = async () => {
		if (newStaffDisabled) {
			toast.error("One or more of the required data field are malformed or missing.");
			return;
		}

		loading = true;
		toast.info("Creating new staff member...");

		try {
			const req = await fetch("/api/admin/staff", {
				method: "POST",
				body: JSON.stringify({
					action: sheetConfig,
					obj: {
						// the server should handle setting of the creator via cookie
						username: udf1,
						full_names: udf2.trim(),
						department: udf3,
						email: udf4,
						phone: udf5,
						ticketable: udp1 === "yes",
					},
				}),
			});

			const res: GenericResponseWData<StaffRow | undefined> = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			if (res.data) {
				appendMember(res.data);
			}
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

	const blockUnblockStaff = async () => {
		loading = true;
		toast.info(
			`${sheetConfig === "block" ? "Revoking" : "Reinstating"} ${toTitleCase(activeRow.username)}'s system access...`,
		);

		try {
			const req = await fetch("/api/admin/staff", {
				method: "POST",
				body: JSON.stringify({
					action: sheetConfig,
					obj: activeRow,
				}),
			});

			const res: GenericResponseWData<StaffRow | undefined> = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			if (res.data) {
				updateMember(res.data);
			}
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
	title="Staff | SBZ Admin"
	ogTitle="Staff"
	description="Manage user access."
	ogDescription="Manage user access."
/>

{#if initialising}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Staff</h1>
			<Button variant="secondary" class="loading ml-2" disabled
				>Filter By: ...<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Staff..." type="text" disabled />
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Staff</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Staff..." type="text" disabled />
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
				{#if data.perimissions.includes("add-staff")}
					<Button variant="outline" class="loading no-padding ml-4"
						>Add Member<PlusCircle class="ml-2 h-4 w-4" /></Button
					>
				{/if}
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
{:else if !staffData.length}
	{#if isMobile}
		<div class="flex flex-row items-center justify-between">
			<h1>Staff</h1>
			<Button variant="secondary" class="ml-2" disabled
				>Filter By: ...<SlidersHorizontal class="ml-2 h-4 w-4" /></Button
			>
		</div>
		<div class="mt-2 flex w-[100%] flex-row items-center justify-end">
			<Search class="mr-4" />
			<Input class="w-[100%]" placeholder="Filter Staff..." type="text" disabled />
		</div>
		<h3 class="mx-auto mt-4 text-center">No data.</h3>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<h1>Staff</h1>
			<div class="flex w-[50%] items-center">
				<Search class="mr-4 h-10 w-10" />
				<Input class="w-[100%]" placeholder="Filter Staff..." type="text" disabled />
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
				{#if data.perimissions.includes("add-staff")}
					<Button
						variant="outline"
						class="ml-4"
						disabled={loading}
						onclick={() => openSheet("new", initStaff)}
						>Add Member<PlusCircle class="ml-2 h-4 w-4" /></Button
					>
				{/if}
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
		<h1>Staff</h1>
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
		<Input class="w-[100%]" placeholder="Filter Staff..." type="text" />
	</div>
{:else}
	<div class="flex flex-row items-center justify-between">
		<h1>Staff</h1>
		<div class="flex w-[50%] items-center">
			<Search class="mr-4 h-10 w-10" />
			<Input
				class="w-[100%]"
				bind:value={globalFilterValue}
				placeholder="Filter Staff..."
				type="text"
			/>
			<AnyCombobox
				handler={updateStrongFilter}
				data={{
					grouped: [
						{
							title: "Status",
							group: [
								{ label: "Active", value: "active" },
								{ label: "Blocked", value: "blocked" },
							],
						},
						{
							title: "Ticketable",
							group: [
								{ label: "Yes", value: "ticketable" },
								{ label: "No", value: "non-ticketable" },
							],
						},
					],
					ungrouped: [{ label: "None", value: "none" }],
				}}
				dataTitle="Filter"
				classes="ml-4"
				icon="filter"
			/>
			{#if data.perimissions.includes("add-staff")}
				<Button
					variant="outline"
					class="ml-4"
					disabled={loading}
					onclick={() => openSheet("new", initStaff)}
					>Add Member<PlusCircle class="ml-2 h-4 w-4" /></Button
				>
			{/if}
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
					<strong>Total:</strong> <span class="num">{numParse(filteredStaff.length)}</span>
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
			{#if sheetConfig === "new"}
				<div class="flex w-full max-w-sm flex-col gap-1.5">
					<Label>Username</Label>
					<Input
						bind:value={udf1}
						placeholder="..."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") addStaff();
						}}
						oninput={(e) => {
							//@ts-ignore
							udf1 = e.target.value.replace(/[^a-z]/g, "");
						}}
					/>
					<p class="text-justify text-sm text-muted-foreground">This cannot be changed later.</p>
				</div>

				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Full Names</Label>
					<Input
						bind:value={udf2}
						placeholder="..."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") addStaff();
						}}
						oninput={(e) => {
							//@ts-ignore
							udf2 = toTitleCase(e.target.value);
						}}
					/>
				</div>

				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Deparment</Label>
					<Input
						bind:value={udf3}
						placeholder="..."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") addStaff();
						}}
						oninput={(e) => {
							//@ts-ignore
							udf3 = toTitleCase(e.target.value);
						}}
					/>
				</div>

				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Email</Label>
					<Input
						bind:value={udf4}
						placeholder="..."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") addStaff();
						}}
						oninput={(e) => {
							//@ts-ignore
							udf4 = e.target.value.trim();
						}}
					/>
				</div>

				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Phone</Label>
					<Input
						bind:value={udf5}
						placeholder="..."
						disabled={loading}
						onkeypress={(e) => {
							if (e.key === "Enter") addStaff();
						}}
						oninput={(e) => {
							//@ts-ignore
							udf5 = e.target.value.replace(/[^0-9]/g, "");
						}}
					/>
				</div>

				<!--
				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Permissions</Label>
					<AnyPicker
						data={systemPermissions.map((p) => {
							return { value: p, label: toTitleCase(p.replace("-", "")) };
						})}
						handler={permisHandler}
						pickerTitle="Permission"
						value=""
					/>
					<p class="text-justify text-sm text-muted-foreground">
						These are solely admin privileges with 100% fine contol.
					</p>
				</div>
				-->

				<div class="mt-6 flex w-full max-w-sm flex-col gap-1.5">
					<Label>Ticketable</Label>
					<AnyPicker
						handler={changeUdp1}
						data={[
							{ label: "Yes", value: "yes" },
							{ label: "No", value: "no" },
						]}
						pickerTitle="Status"
						value={udp1}
					/>
					<p class="text-justify text-sm text-muted-foreground">
						Whether or not the user should be assigned tickets.
					</p>
				</div>
			{/if}

			<!-- BLOCK STAFF
			{#if sheetConfig === "block"}
				<p>W.I.P</p>
			{/if}
			-->

			{#if sheetConfig === "edit"}
				<p>W.I.P</p>
			{/if}

			{#if sheetConfig === "perms"}
				<p>W.I.P</p>
			{/if}

			<!-- UNBLOCK STAFF
			{#if sheetConfig === "unblock"}
				<p>W.I.P</p>
			{/if}
			-->
		{/snippet}

		{#snippet actionButton()}
			{#if sheetConfig === "new"}
				<Button disabled={newStaffDisabled} onclick={addStaff}
					>Submit<Upload class="ml-2 h-4 w-4" /></Button
				>
			{/if}

			{#if sheetConfig === "block" || sheetConfig === "unblock"}
				<Button
					variant={sheetConfig === "block" ? "destructive" : "default"}
					disabled={loading}
					onclick={blockUnblockStaff}
					>{#if sheetConfig === "block"}
						Block<Lock class="ml-2 h-4 w-4" />
					{:else if sheetConfig === "unblock"}
						Unblock<LockOpen class="ml-2 h-4 w-4" />
					{/if}
				</Button>
			{/if}

			{#if sheetConfig === "on-duty" || sheetConfig === "on-leave"}
				<Button
					variant={sheetConfig === "on-leave" ? "destructive" : "default"}
					disabled={loading}
					onclick={blockUnblockStaff}
					>{#if sheetConfig === "on-leave"}
						Mark<Pause class="ml-2 h-4 w-4" />
					{:else if sheetConfig === "on-duty"}
						Unmark<Play class="ml-2 h-4 w-4" />
					{/if}
				</Button>
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
