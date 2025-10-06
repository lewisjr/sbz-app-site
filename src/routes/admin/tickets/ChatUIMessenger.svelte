<script lang="ts">
	//function
	import { toast } from "svelte-sonner";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { formatDbTime, genId } from "$lib/utils";
	import { onMount, tick } from "svelte";
	import { createClient } from "@supabase/supabase-js";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";

	//types
	import type {
		SBZdb,
		Types,
		TicketRowLean,
		GenericResponse,
		GenericResponseWData,
	} from "$lib/types";
	import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

	//icons
	import { Upload, Loader2Icon } from "@lucide/svelte";

	interface Props {
		data: {
			ticketId: string;
			ticket: TicketRowLean;
			dbUrl: string;
			dbAuth: string;
			admin: string;
		};
	}

	let { data }: Props = $props();

	let initialising = $state<boolean>(true);
	let loading = $state<boolean>(false);
	let typing = $state<boolean>(false);

	type OdynChat = SBZdb["public"]["Tables"]["odyn-chats"]["Row"];

	let messages = $state<OdynChat[]>([]);
	const initMessage = (msgs: OdynChat[]) => {
		messages = [
			{
				body: data.ticket.query,
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			} /*
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			{
				body: data.ticket.query + " " + genId(),
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},*/,
			...msgs,
		];
	};

	const scrollToBottom = () => {
		if (document) {
			const mid = document.getElementById("mid");
			if (mid) {
				mid.scrollTop = mid.scrollHeight;
			}
		}
	};

	const getChats = async () => {
		try {
			const req = await fetch(`/api/admin/tickets/chat?t=${data.ticketId}`);
			const res: GenericResponseWData<OdynChat[]> = await req.json();

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			initMessage(res.data);
			initialising = false;

			await tick();
			scrollToBottom();
		} catch (ex: any) {
			loading = false;

			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
			return;
		}
	};

	const playNotif = () => {
		if (document) {
			//@ts-ignore
			const el: HTMLAudioElement | null = document.getElementById("notif");

			if (el) el.play();
		}
	};

	const decryptBody = async (txt: string): Promise<string> => {
		try {
			const req = await fetch("/api/admin/tickets/chat", {
				method: "PATCH",
				body: JSON.stringify({ txt }),
			});

			const res: GenericResponseWData<string> = await req.json();

			if (!res.success) {
				toast.error(res.message);
				return res.data;
			}

			playNotif();
			return res.data;
		} catch (ex: any) {
			loading = false;
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
			return "Error decrypting.";
		}
	};

	const msgEventHandler = async (payload: any) => {
		const obj: OdynChat = payload.new;

		if (obj.sender !== data.admin) playNotif();

		obj.body = await decryptBody(obj.body);

		messages = [...messages, obj];
		scrollToBottom();
	};

	let listener = $state<SupabaseClient<SBZdb> | undefined>(undefined);
	let msgEvent = $state<RealtimeChannel | undefined>(undefined);

	let textValue = $state<string>("");

	const sendChat = async () => {
		loading = true;

		const obj = {
			body: textValue.trim(),
			sender: data.admin,
			ticket_no: data.ticketId,
			type: "text",
		};

		try {
			const req = await fetch("/api/admin/tickets/chat/fb", {
				method: "PUT",
				body: JSON.stringify({
					data: obj,
					clientUid: data.ticket.uid,
				}),
			});

			const res: GenericResponse = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			textValue = "";
		} catch (ex: any) {
			loading = false;

			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
			return;
		}
	};

	// will only listen for messages if not AI
	onMount(() => {
		(async () => {
			await getChats();

			if (data.ticket.assigned !== "odyn" && !data.ticket.is_closed) {
				listener = createClient<SBZdb>(data.dbUrl, data.dbAuth);

				msgEvent = listener
					.channel(`ticket-${data.ticketId}`)
					.on(
						"postgres_changes",
						{
							event: "INSERT",
							schema: "public",
							table: "odyn-chats",
							filter: `ticket_no=eq.${data.ticketId}`,
						},
						msgEventHandler,
					)
					.subscribe();
			}
		})();

		return () => {
			if (listener && msgEvent) {
				listener.removeChannel(msgEvent);
			}
		};
	});
</script>

<audio id="notif" src="/notif.mp3"></audio>

{#if initialising}
	<div class="chat-div">
		<div class="tp">
			<p class="font-bold">Ticket #{data.ticketId}</p>

			<table>
				<thead>
					<tr>
						<th class="text-center text-sm">Client</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="px-2 text-center text-sm"
							><span class="loading no-padding">{toTitleCase(data.ticket.names.split(" ")[0])}</span
							></td
						>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="mid">
			<ul>
				<li class="other loading no-padding">
					<p class="text !text-transparent">Lorem ipsum dolor sit amet consectetur.</p>
				</li>

				<li class="self loading no-padding">
					<p class="text !text-transparent">Lorem ipsum dolor sit amet</p>
				</li>

				<li class="other loading no-padding">
					<p class="text !text-transparent">Lorem ipsum dolor sit consect.</p>
				</li>

				<li class="other loading no-padding">
					<p class="text !text-transparent">Lorem ipsum dolor sit.</p>
				</li>

				<li class="self loading no-padding">
					<p class="text !text-transparent">
						Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet
					</p>
				</li>
			</ul>
		</div>

		<div class="btm">
			<Textarea
				value="lorem"
				disabled
				class="loading min-h-[1.5em] w-[80%] resize-none leading-[1.5em]"
			/>
			<Button class="loading !rounded-full" disabled>
				<Upload />
			</Button>
		</div>
	</div>
{:else}
	<div class="chat-div">
		<div class="tp">
			<p class="font-bold">Ticket #{data.ticketId}</p>

			<table>
				<thead>
					<tr>
						<th class="text-center text-sm">Client</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="px-2 text-center text-sm">{toTitleCase(data.ticket.names.split(" ")[0])}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div id="mid" class="mid">
			<ul>
				{#each messages as msg}
					{#if msg.sender === data.ticket.names}
						<li class="other">
							<p class="text">{msg.body}</p>
							<p class="note">{formatDbTime(msg.created_at)}</p>
						</li>
					{:else}
						<li class="self">
							<p class="note">{toTitleCase(msg.sender)}</p>
							<p class="text">
								{#each msg.body.split("||") as txt}
									{#if txt === "newline"}
										<br /><br />
									{:else}
										<span>{txt}</span>
									{/if}
								{/each}
							</p>
							<p class="note">{formatDbTime(msg.created_at)}</p>
						</li>
					{/if}
				{/each}

				{#if typing}
					<li class="typing">
						<div class="ball one"></div>
						<div class="ball two mx-1"></div>
						<div class="ball three"></div>
					</li>
				{/if}

				{#if data.ticket.closed_by && data.ticket.close_date && data.ticket.close_reason}
					<p class="mx-auto mt-5 w-[93%] text-center text-sm text-muted-foreground">
						<b
							>{data.ticket.closed_by === data.admin
								? "You"
								: toTitleCase(data.ticket.closed_by)}</b
						>
						closed this ticket at
						<b>{formatDbTime(data.ticket.close_date)}</b>
						with the following reason:<br /><br /><i>{data.ticket.close_reason}</i>
					</p>
				{/if}
			</ul>
		</div>

		{#if data.admin === data.ticket.assigned && !data.ticket.is_closed}
			<div class="btm">
				<Textarea
					bind:value={textValue}
					disabled={loading}
					class="max-h-[4.5em] min-h-[1.5em] w-[80%] resize-none overflow-y-auto leading-[1.5em]"
					maxlength={200}
					onkeypress={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();

							if (!(textValue.length < 10 || loading)) sendChat();
						}
					}}
				/>
				<Button class="rounded-full" disabled={textValue.length < 10 || loading} onclick={sendChat}>
					{#if loading}
						<Loader2Icon class="animate-spin" />
					{:else}
						<Upload />
					{/if}
				</Button>
			</div>
		{:else}
			<div class="btm">
				<Textarea
					value="lorem"
					disabled
					class="max-h-[4.5em] min-h-[1.5em] w-[80%] resize-none overflow-y-auto leading-[1.5em] text-transparent"
				/>
				<Button class="rounded-full" disabled>
					<Upload />
				</Button>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.chat-div {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column; // critical
		border-top: 1px solid var(--muted);
		border-bottom: 1px solid var(--muted);

		.tp {
			flex: 0 0 auto; // natural height
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 10px;
			box-shadow: 0px 0px 3px var(--shadow);
			position: relative;
			z-index: 1;
		}

		.mid {
			flex: 1 1 auto; // fills remaining space
			width: 100%;
			background-color: var(--secondary);
			overflow-y: auto; // so chat can scroll
			display: flex;
			flex-direction: column;

			ul {
				padding: 10px;
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-end;
				flex: 1;

				li {
					margin-bottom: 8px;
					max-width: 80%;
					width: fit-content;
					display: flex;

					&.self {
						align-self: flex-end; // messages from the current user
						display: flex;
						flex-direction: column;

						.text {
							background-color: #3b82f6;
							color: white;
							border-radius: 12px 12px 0 12px;
							padding: 6px 10px;
							font-size: 1em;

							@media screen and (max-width: 768px) {
								font-size: 0.9em;
							}
						}

						.note {
							width: 100%;
							text-align: end;
							font-style: italic;
							font-size: 0.7em;
							opacity: 0.7;
						}
					}

					&.other {
						align-self: flex-start; // messages from others
						display: flex;
						flex-direction: column;

						.text {
							background-color: #e5e7eb;
							color: black;
							border-radius: 12px 12px 12px 0;
							padding: 6px 10px;
						}

						.note {
							width: 100%;
							text-align: start;
							font-style: italic;
							font-size: 0.7em;
							opacity: 0.7;
						}
					}

					&.typing {
						align-self: flex-star; // messages from the current user
						background-color: #e5e7eb;
						border-radius: 12px 12px 12px 0;
						padding: 10px 10px;
						position: relative;

						@keyframes jump {
							0% {
								bottom: -2px;
							}
							50% {
								bottom: 2px;
							}
							100% {
								bottom: -2px;
							}
						}

						.ball {
							width: 8px;
							height: 8px;
							background-color: #b5b5b5;
							opacity: 0.7;
							border-radius: 50%;
							position: relative;
							animation: jump 700ms linear infinite;

							&.one {
								animation-delay: 0ms;
							}

							&.two {
								animation-delay: 200ms;
							}

							&.three {
								animation-delay: 300ms;
							}
						}
					}
				}
			}
		}

		.btm {
			flex: 0 0 auto; // natural height
			display: flex;
			flex-direction: row;
			align-items: flex-end; // input grows upward
			justify-content: space-between;
			padding: 10px;
			box-shadow: 0px 0px 3px var(--shadow);
		}
	}
</style>
