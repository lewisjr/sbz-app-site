<script lang="ts">
	//functions
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { invalidateAll } from "$app/navigation";
	import { formatDbTime } from "$lib/utils";
	import { toTitleCase } from "@cerebrusinc/fstring";
	import { createClient } from "@supabase/supabase-js";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import OTP from "$lib/components/OTP.svelte";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//icons
	import { Frown, MoveLeft, Upload, Loader2Icon } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";
	import type { GenericResponse, SBZdb, GenericResponseWData } from "$lib/types";
	import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

	let { data }: PageProps = $props();

	let isMobile = $derived($screenWidthStore < 767);

	let loading = $state<boolean>(false);

	let otpInput = $state<string>("");
	const otpInputHandler = (val: string) => {
		otpInput = val;
	};

	const checkOtp = async () => {
		if (otpInput.length !== 6) {
			toast.error("Your OTP is too short!");
			return;
		}

		toast.info("Verifying your identity...");

		console.log({ user: data.ticket.email, otp: Number(otpInput) });

		try {
			loading = true;
			const req = await fetch("/api/chat", {
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({ user: data.ticket.email, otp: Number(otpInput) }),
			});

			const res: GenericResponse = await req.json();

			loading = false;

			if (res.success) {
				toast.success(res.message);
				invalidateAll();
				return;
			}

			toast.error(res.message);
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

	// run check otp when user enters 6 chars
	$effect(() => {
		if (otpInput.length === 6) checkOtp();
	});

	type OnlineStatus = "onl" | "ofl";
	let onlineStatus = $state<OnlineStatus>("ofl");
	const toggleOnlineStatus = (stat: OnlineStatus) => {
		onlineStatus = stat;
	};

	// set initial online status if room is with odyn only
	$effect(() => {
		if (data.assigneeEmail === "none" && !data.error && !data.otp) {
			toggleOnlineStatus("onl");
		}
	});

	let textValue = $state<string>("");
	let typing = $state<boolean>(false);

	type OdynChat = SBZdb["public"]["Tables"]["odyn-chats"]["Row"];

	let messages = $state<OdynChat[]>([]);
	const initMessage = () => {
		messages = [
			{
				body: data.ticket.query,
				created_at: data.ticket.created_at,
				id: -1,
				sender: data.ticket.names,
				ticket_no: data.ticketId,
				type: "text",
			},
			...data.messages,
		];
	};

	// set initial message as query
	$effect(() => {
		if (!data.error && !data.otp) {
			initMessage();
		}
	});

	const playNotif = () => {
		if (document) {
			//@ts-ignore
			const el: HTMLAudioElement | null = document.getElementById("notif");

			if (el) el.play();
		}
	};

	const sendChat = async () => {
		loading = true;

		const obj = {
			body: textValue.trim(),
			sender: data.ticket.names,
			ticket_no: data.ticketId,
			type: "text",
		};

		const notifConfig = {
			email: data.assigneeEmail === "none" ? false : data.assigneeEmail,
			msgId: data.ticket.assignee_email_vars ?? "",
			subject: "",
			name: data.ticket.assigned,
		};

		try {
			const req = await fetch("/api/chat", {
				method: "PUT",
				body: JSON.stringify({ obj, notifConfig }),
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

	const decryptBody = async (txt: string): Promise<string> => {
		try {
			const req = await fetch("/api/chat", {
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
		playNotif();
		const obj: OdynChat = payload.new;

		obj.body = await decryptBody(obj.body);

		messages = [...messages, obj];
	};

	let typingTime = $state<number>(0);
	let stopTypingTimer = $state<ReturnType<typeof setTimeout> | undefined>(undefined);

	const typingEventHandler = (payload: any) => {
		const obj: { sender: string; on: boolean } = payload.payload;

		if (obj.sender !== data.ticket.names && obj.on) {
			typing = true;
		}

		if (obj.sender !== data.ticket.names && !obj.on) {
			typing = false;
		}
	};

	let onlineTime = $state<number>(0);

	const onlineEventHandler = (payload: any) => {
		const obj: { sender: string; on: boolean } = payload.payload;

		if (obj.sender === data.ticket.assigned && obj.on) {
			toggleOnlineStatus("onl");
		}

		if (obj.sender === data.ticket.assigned && !obj.on) {
			toggleOnlineStatus("ofl");
		}
	};

	let listener = $state<SupabaseClient<SBZdb> | undefined>(undefined);
	let msgEvent = $state<RealtimeChannel | undefined>(undefined);
	let typingEvent = $state<RealtimeChannel | undefined>(undefined);
	let onlineEvent = $state<RealtimeChannel | undefined>(undefined);

	const broadcastTyping = () => {
		if (typingEvent && data.ticket.assigned !== "odyn") {
			const d2 = Date.now();
			const diff = d2 - typingTime;

			// initialise and broadcast
			if (!typingTime || diff > 10000) {
				typingTime = Date.now();

				typingEvent.send({
					type: "broadcast",
					event: "typing",
					payload: { sender: data.ticket.names, on: true },
				});
			}

			// Reset the stop typing timer
			if (stopTypingTimer) clearTimeout(stopTypingTimer);

			stopTypingTimer = setTimeout(() => {
				// 3 seconds have passed since last typing
				if (typingEvent) {
					typingEvent.send({
						type: "broadcast",
						event: "typing",
						payload: { sender: data.ticket.names, on: false },
					});
					typingTime = 0; // reset typing time
				}
			}, 3000);
		}
	};

	const broadcastOnline = () => {
		if (onlineEvent && data.ticket.assigned !== "odyn") {
			const d2 = Date.now();
			const diff = d2 - onlineTime;

			// initialise and broadcast
			if (!onlineTime || diff > 60000) {
				onlineTime = Date.now();

				onlineEvent.send({
					type: "broadcast",
					event: "online",
					payload: { sender: data.ticket.names, on: true },
				});
			}
		}
	};

	const checkForOnline = () => {
		if (data.ticket.assigned !== "odyn") {
			const d2 = Date.now();
			const diff = d2 - onlineTime;

			if (diff > 60010) {
				onlineStatus = "ofl";
			}
		}
	};

	let broadcastOnlineInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);
	let checkForOnlineInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

	onMount(() => {
		if (!data.error && !data.otp) {
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

			typingEvent = listener
				.channel(`ticket-${data.ticketId}`)
				.on("broadcast", { event: "typing" }, typingEventHandler)
				.subscribe();

			onlineEvent = listener
				.channel(`ticket-${data.ticketId}`)
				.on("broadcast", { event: "online" }, onlineEventHandler)
				.subscribe();

			broadcastOnline();

			broadcastOnlineInterval = setInterval(broadcastOnline, 60010);

			checkForOnlineInterval = setInterval(checkForOnline, 60020);

			return () => {
				clearInterval(broadcastOnlineInterval);
				clearInterval(checkForOnlineInterval);

				if (listener && msgEvent) {
					listener.removeChannel(msgEvent);
				}

				if (listener && typingEvent) {
					listener.removeChannel(typingEvent);
				}

				if (listener && onlineEvent) {
					listener.removeChannel(onlineEvent);
				}
			};
		}
	});
</script>

<Head
	title={`Ticket ${data.ticketId} | SBZ Digital`}
	ogTitle={`Ticket ${data.ticketId}`}
	description="Chat with your assigned broker!"
	ogDescription="Chat with your assigned broker!"
/>

{#if data.error}
	<div class="mid-div">
		<Frown class="h-16 w-16" />
		<h1 class="my-4">Error!</h1>
		<p class="w-[89%] text-center">
			Failed to fetch your chat room! Please try again after 5 minutes.
		</p>
	</div>
{:else if data.otp}
	<div class="mid-div">
		<h1>OTP</h1>
		<p class="my-4 w-[89%] text-center">
			To ensure privacy and security, we have sent an OTP to your email to confirm your identity.
		</p>
		<OTP handler={otpInputHandler} bind:disabled={loading} />
	</div>
{:else}
	<audio id="notif" src="/notif.mp3"></audio>
	<div class="chat-div">
		<div class="tp">
			<p class="font-bold">Ticket #{data.ticketId}</p>

			<table>
				<thead>
					<tr>
						<th class="text-center text-sm" colspan="2">Broker</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="text-center text-sm"
							>{data.assigneeEmail === "none" ? "AI" : data.ticket.assigned}</td
						>
						<td><span class={`onl-status ${onlineStatus}`}></span></td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="mid">
			<ul>
				{#each messages as msg}
					{#if msg.sender === data.ticket.names}
						<li class="self">
							<p class="text">{msg.body}</p>
							<p class="note">{formatDbTime(msg.created_at)}</p>
						</li>
					{:else}
						<li class="other">
							<p class="note">{msg.sender === "odyn" ? "AI" : toTitleCase(msg.sender)}</p>
							<p class="text">{msg.body}</p>
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
			</ul>
		</div>

		<div class="btm">
			<Textarea
				bind:value={textValue}
				disabled={loading}
				class="max-h-[4.5em] min-h-[1.5em] w-[80%] resize-none overflow-y-auto leading-[1.5em]"
				maxlength={200}
				oninput={() => broadcastTyping()}
			/>
			<Button class="rounded-full" disabled={textValue.length < 10 || loading} onclick={sendChat}>
				{#if loading}
					<Loader2Icon class="animate-spin" />
				{:else}
					<Upload />
				{/if}
			</Button>
		</div>
	</div>
{/if}

<style lang="scss">
	.mid-div {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		@media screen and (max-width: 1024px) {
			height: 100dvh;
		}
	}

	.chat-div {
		height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column; // critical

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

			.onl-status {
				width: 10px;
				height: 10px;
				display: block;
				border-radius: 50%;

				&.onl {
					background-color: var(--sbz-green);
				}

				&.ofl {
					background-color: var(--sbz-red);
				}
			}
		}

		.mid {
			flex: 1 1 auto; // fills remaining space
			width: 100%;
			background-color: var(--secondary);
			overflow-y: auto; // so chat can scroll
			display: flex;
			align-items: flex-end;

			ul {
				padding: 10px;
				width: 100%;
				display: flex;
				flex-direction: column;

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
