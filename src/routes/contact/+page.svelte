<script lang="ts">
	//functions
	import { goto } from "$app/navigation";
	import { queryTypesArray, referralSourcesArray } from "$lib/utils";
	import isEmail from "is-email";
	import { toast } from "svelte-sonner";

	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import AnyPicker from "$lib/components/AnyPicker.svelte";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import Textarea from "$lib/components/ui/textarea/textarea.svelte";

	//types
	import type { Types, GenericResponseWData, GenericResponse } from "$lib/types";

	//icons
	import { MessageCircle, LogIn, ArrowRight, Upload, MoveLeft } from "@lucide/svelte";

	//types
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let isMobile = $derived($screenWidthStore < 768);
	let year = new Date().getFullYear();

	let loading = $state<boolean>(false);

	type Position = "1" | "2" | "3" | "4" | "5" | "6";

	let contentPosition = $state<Position>("1");
	const changePosition = () => {
		const num = Number(contentPosition);

		const nextPosition = (num + 1).toString() as Position;

		contentPosition = nextPosition;
	};

	let namesValue = $state<string>("");
	let phoneValue = $state<string>("");
	let emailValue = $state<string>("");
	let idNumValue = $state<string>("");

	let isClient = $state<boolean>(false);
	const changeIsClient = (val: boolean) => {
		isClient = val;
	};

	let luseIdValue = $state<string>("");

	let referral = $state<string>("");
	const changeReferral = (val: Types["ReferralSource"]) => {
		referral = val;
	};

	let queryType = $state<string>("");
	const changeQtype = (val: Types["QueryTypes"]) => {
		queryType = val;
	};

	let queryText = $state<string>("");

	const platform = "Web";

	let nextDisabled = $derived.by(() => {
		let val: boolean = false;

		const v1Disabled =
			namesValue.length < 5 ||
			phoneValue.length < 8 ||
			!isEmail(emailValue) ||
			idNumValue.length < 5;

		const v2Disabled = isClient ? (luseIdValue.length ? false : true) : false;

		const v3Disabled = referral ? !referral.length : true;

		const preV4 = queryType ? !queryType.length : true;

		const v4Disabled = preV4 || queryText.length < 10;

		switch (contentPosition) {
			case "1":
				val = v1Disabled;
				break;
			case "2":
				val = v2Disabled || v1Disabled;
				break;
			case "3":
				val = v3Disabled || v2Disabled || v1Disabled;
				break;
			case "4":
				val = v4Disabled || v3Disabled || v2Disabled || v1Disabled;
				break;
			default:
				break;
		}

		return val;
	});

	let endButtonText = $derived.by(() => {
		if (queryType === "QT:Compliment") {
			return "Submit";
		} else {
			return "Open Chat";
		}
	});

	const addCompliment = async () => {
		toast.info("Submitting your compliment...");
		loading = true;

		const obj = {
			email: emailValue,
			id_num: idNumValue,
			luse_id: isClient ? Number(luseIdValue) : -1,
			names: namesValue,
			phone: phoneValue,
			platform,
			query: queryText,
			query_type: queryType.replace("QT:", ""),
			referral_source: referral.replace("RS:", ""),
			uid: emailValue,
			is_client: isClient,
		};

		try {
			const req = await fetch("/api/cn", {
				method: "PUT",
				body: JSON.stringify(obj),
			});

			const res: GenericResponse = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			contentPosition = "5";
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

	const createChatRoom = async () => {
		toast.info("Creating ticket...");
		loading = true;

		const obj = {
			email: emailValue,
			id_num: idNumValue,
			luse_id: isClient ? Number(luseIdValue) : -1,
			names: namesValue,
			phone: phoneValue,
			platform,
			query: queryText,
			query_type: queryType.replace("QT:", ""),
			referral_source: referral.replace("RS:", ""),
			uid: emailValue,
			is_client: isClient,
		};

		try {
			const req = await fetch("/api/cn", {
				method: "POST",
				body: JSON.stringify(obj),
			});

			const res: GenericResponseWData<string> = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			if (res.data.startsWith("/")) goto(res.data);
			else contentPosition = "6";
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

	const processQuery = () => {
		if (queryType === "QT:Compliment") {
			addCompliment();
		} else {
			createChatRoom();
		}
	};

	/*
	let tClass = $state<"fin" | "fout" | "norm">("norm");

	const changeSection = () => {
		tClass = "fout";
		setTimeout(() => {
			tClass = "fin";
		}, 260);
	};

	$effect(() => {
		setTimeout(() => {
			changeSection();
		}, 500);
	});
    */

	/* Scaffold
	const _scaffoldTicket = () => {
		namesValue = "Test Person";
		phoneValue = "260776552592";
		emailValue = "privatodato@gmail.com";
		idNumValue = "554721101";
		isClient = false;

		changeReferral("RS:ZBT");
	};

	$effect(() => {
		_scaffoldTicket();
	});
    */
</script>

<Head
	title="Speak To A Broker | SBZ Digital"
	ogTitle="Speak To A Broker"
	description="Speak directly to a broker and get answers to your queries!"
	ogDescription="Speak directly to a broker and get answers to your queries!"
/>

{#if data.isApp}
	<div class="app"></div>
{/if}
<div class="tainer">
	<header>
		{#if !data.isApp}
			<div class="flex flex-row items-center">
				<img class="h-[60px] w-[60px]" src="/img/logo-bull.png" alt="sbz-logo" />
				<h3 class="ml-2">SBZ Digital</h3>
			</div>

			{#if !isMobile}
				<div class="links">
					<div class="link">
						<a href="/#stock">Market Data</a>
					</div>

					<div class="link">
						<a href="/#portfolio">Portfolio Analysis</a>
					</div>

					<div class="link">
						<a href="/#screener">Screener</a>
					</div>

					<div class="link">
						<a href="/#news">News</a>
					</div>

					<div class="link">
						<a href="/#advisory">Advisory</a>
					</div>
				</div>
			{/if}

			<div class={`flex${!isMobile ? " flex-row" : " flex-col items-end"}`}>
				<Button
					href="/sign-in"
					style="text-decoration: none; font-weight: 600;"
					class={`text-white${!isMobile ? " mr-4" : " mb-1"}`}
					>Sign In<LogIn class="ml-1 h-4 w-4" /></Button
				>
				<Button variant="outline" href="/contact" style="text-decoration: none; font-weight: 600;"
					>Contact<MessageCircle class="ml-2 h-4 w-4" /></Button
				>
			</div>
		{:else}
			<div class="flex w-full flex-row items-center justify-between">
				<Button variant="ghost" href="/sign-in"><MoveLeft class="h-8 w-8" /></Button>
				<div class="flex flex-row items-center justify-between">
					<img class="h-[60px] w-[60px]" src="/img/logo-bull.png" alt="sbz-logo" />
					<h3 class="ml-2">SBZ Digital</h3>
				</div>
			</div>
		{/if}
	</header>

	<section class={`box border`}>
		<h3 class="mb-0">
			{#if contentPosition === "1"}
				Personal Details
			{/if}

			{#if contentPosition === "2"}
				Account Details
			{/if}

			{#if contentPosition === "3"}
				Survey
			{/if}

			{#if contentPosition === "4"}
				Query Details
			{/if}

			{#if contentPosition === "5"}
				Thank You!
			{/if}

			{#if contentPosition === "6"}
				Ticket Opened!
			{/if}
		</h3>
		<section class="inputs">
			{#if contentPosition === "1"}
				<div class="items flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label>Full Names</Label>
						<Input
							bind:value={namesValue}
							placeholder="John Banda"
							disabled={loading}
							oninput={(e) => {
								//@ts-ignore
								namesValue = toTitleCase(e.target.value);
							}}
						/>
						<p class="text-justify text-sm text-muted-foreground">
							Your full names as they appears on your ID.
						</p>
					</div>

					<div class="cntnt-r flex w-full max-w-sm flex-col gap-1.5">
						<Label>Phone</Label>
						<Input
							bind:value={phoneValue}
							placeholder="260776574628"
							disabled={loading}
							oninput={(e) => {
								//@ts-ignore
								phoneValue = e.target.value.replace(/[^0-9]/g, "");
							}}
							inputmode="tel"
						/>
						<p class="text-justify text-sm text-muted-foreground">
							Include the international code.
						</p>
					</div>
				</div>

				<div class="items tp flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label>Email</Label>
						<Input
							bind:value={emailValue}
							placeholder="bmutale@gmail.com"
							disabled={loading}
							inputmode="email"
						/>
						<p class="text-justify text-sm text-muted-foreground">
							We'll use this to send you notifications.
						</p>
					</div>

					<div class="cntnt-r flex w-full max-w-sm flex-col gap-1.5">
						<Label>ID Number</Label>
						<Input
							bind:value={idNumValue}
							placeholder="234976101"
							disabled={loading}
							oninput={(e) => {
								//@ts-ignore
								idNumValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
							}}
						/>
						<p class="text-justify text-sm text-muted-foreground">
							Leave out any special characters.
						</p>
					</div>
				</div>

				<Button class="mt-5" disabled={nextDisabled} onclick={changePosition}
					>Next<ArrowRight /></Button
				>
			{/if}

			{#if contentPosition === "2"}
				<div class="items flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label class="mb-1">Is SBZ Your Broker?</Label>
						<AnyPicker
							data={[
								{ label: "Yes", value: true },
								{ label: "No", value: false },
							]}
							handler={changeIsClient}
							value={undefined}
							pickerTitle="Option"
						/>
					</div>

					{#if isClient}
						<div class="cntnt-r flex w-full max-w-sm flex-col gap-1.5">
							<Label>LuSE ID</Label>
							<Input
								class="my-2"
								bind:value={luseIdValue}
								placeholder="465345"
								disabled={loading}
								oninput={(e) => {
									//@ts-ignore
									luseIdValue = e.target.value.replace(/[^0-9]/g, "");
								}}
								inputmode="numeric"
							/>
						</div>
					{/if}
				</div>

				<Button class="mt-5" disabled={nextDisabled} onclick={changePosition}
					>Next<ArrowRight /></Button
				>
			{/if}

			{#if contentPosition === "3"}
				<div class="items flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label class="mb-1">How Did You Hear of Us?</Label>
						<AnyPicker
							data={referralSourcesArray.map((q) => {
								return { label: q.replace("RS:", ""), value: q };
							})}
							handler={changeReferral}
							value={undefined}
							pickerTitle="Option"
						/>
					</div>
				</div>

				<Button class="mt-5" disabled={nextDisabled} onclick={changePosition}
					>Next<ArrowRight /></Button
				>
			{/if}

			{#if contentPosition === "4"}
				<div class="items flex">
					<div class="cntnt-l flex w-full max-w-sm flex-col gap-1.5">
						<Label class="mb-1">Topic</Label>
						<AnyPicker
							data={queryTypesArray.map((q) => {
								return { label: q.replace("QT:", ""), value: q };
							})}
							handler={changeQtype}
							value={undefined}
							pickerTitle="Option"
						/>
					</div>
				</div>

				{#if queryType}
					<div class="items tp flex">
						<div class="flex w-full max-w-sm flex-col gap-1.5">
							<Label class="mb-1">Query</Label>
							<Textarea
								bind:value={queryText}
								placeholder="Briefly explain your query."
								disabled={loading}
								maxlength={200}
								class="h-[150px] w-[400px] max-w-[100%]"
								onkeypress={(e) => {
									if (e.key === "Enter") e.preventDefault();
								}}
							/>
						</div>
					</div>

					<Button class="mt-5" disabled={nextDisabled} onclick={processQuery}
						>Submit<Upload /></Button
					>
				{/if}
			{/if}

			{#if contentPosition === "5"}
				<p class="w-[400px] max-w-[100%] text-justify">
					Your compliment has been well received! What to do now? Feel free to <a href="/sign-up"
						>open an account</a
					>
					or <a href="/sign-in">sign in</a> and take control of your investments!
				</p>
			{/if}

			{#if contentPosition === "6"}
				<p class="w-[400px] max-w-[100%] text-justify">
					An email has been sent to you with your ticket details, a broker should be in touch within
					24 hours.
				</p>
			{/if}
		</section>
	</section>

	<footer>
		<p>
			Built by <a href="https://www.neos.finance" target="_blank" rel="noopener">Neos FinTech</a>
		</p>
		<p class="mb-10">© {year} OmniBot, All Rights Reserved</p>
	</footer>
</div>

<style lang="scss">
	.tainer {
		width: 100%;
		height: fit-content;
		padding: 0px 20px;

		@media screen and (max-width: 769px) {
			padding-top: 10px !important;
		}
	}

	header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		height: 80px;
		width: 100%;

		.links {
			display: flex;
			flex-direction: row;
			align-items: center;
			margin-left: -80px;

			.link {
				margin: 0px 10px;
				transition: 200ms ease all;
				border-bottom: 1px solid transparent;

				&:hover {
					border-bottom: 1px solid hsl(var(--foreground));
				}

				a {
					text-decoration: none;
					color: hsl(var(--foreground));
				}
			}
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.box {
		border-radius: var(--radius);
		margin: 10px auto;
		width: fit-content;
		height: fit-content;
		padding: 20px;
		display: flex;
		flex-direction: column;

		@media screen and (max-width: 769px) {
			width: 100%;
			padding: 20px 10px;

			* {
				font-size: 11pt;
			}
		}

		.inputs {
			display: flex;
			flex-direction: column;
			width: fit-content;
			padding: 14px 0px;
			margin-left: auto;
			margin-right: auto;

			@media screen and (max-width: 1024px) {
				width: 100%;

				.tp {
					margin-top: 20px;
				}
			}

			.cntnt-l {
				margin-right: 30px;

				@media screen and (max-width: 1024px) {
					margin: 0px;
				}
			}

			.cntnt-r {
				margin-left: 30px;

				@media screen and (max-width: 1024px) {
					margin: 0px;
					margin-top: 10px;
				}
			}

			.items {
				flex-direction: row;

				@media screen and (max-width: 1024px) {
					flex-direction: column;
				}

				&.tp {
					margin-top: 20px;
				}
			}
		}

		/*
		&.normal {
			opacity: 1;
		}

		&.fin {
			animation: fade-in 250ms ease linear forwards;
		}

		&.fout {
			animation: fade-out 250ms ease linear forwards;
		}
        */
	}

	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0.7;
	}
</style>
