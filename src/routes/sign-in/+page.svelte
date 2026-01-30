<script lang="ts">
	//functions
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import OTP from "$lib/components/OTP.svelte";

	//components - shadcn
	import Input from "$lib/components/ui/input/input.svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { onMount } from "svelte";
	import { portfolioCacheStore } from "$lib/stores";

	//stores
	import { isAppStore } from "$lib/stores";

	// types
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let label = $state<"Admin Username" | "LuSE ID">("LuSE ID");
	let placeholder = $state<"466932" | "bwalya">("466932");
	let description = $state<
		| "Enter your admin username, if you have forgotten please get in touch with the team."
		| "Enter your LuSE ID / CSD Account number without the leading 0s."
	>("Enter your LuSE ID / CSD Account number without the leading 0s.");

	let inputValue = $state<string>("");

	const changeToInvestor = () => {
		label = "LuSE ID";
		placeholder = "466932";
		description = "Enter your LuSE ID / CSD Account number without the leading 0s.";
	};

	$effect(() => {
		if (!inputValue.length) changeToInvestor();
	});

	const changeToAdmin = () => {
		label = "Admin Username";
		placeholder = "bwalya";
		description =
			"Enter your admin username, if you have forgotten please get in touch with the team.";
	};

	const valueHandler = (value: string) => {
		if (label === "Admin Username") {
			inputValue = value.toLowerCase().trim();
		} else {
			inputValue = value.replace(/[^0-9]/g, "");
		}
	};

	let loading = $state<boolean>(false);

	let buttonDisabled = $derived<boolean>(inputValue.length < 2);

	let otpLayout = $state<boolean>(false);

	const sendOtp = async () => {
		if (buttonDisabled) {
			toast.error("Your ID is too short!");
			return;
		}

		toast.info("Sending OTP...");

		try {
			loading = true;
			const req = await fetch("/api/si", {
				headers: {
					"Content-Type": "application/json",
				},
				method: "PUT",
				body: JSON.stringify({ label, id: inputValue.replace("#", "") }),
			});

			const res = await req.json();

			loading = false;

			if (!res.success) {
				toast.error(res.message);
				return;
			}
			toast.success(res.message);
			otpLayout = true;
		} catch (ex: any) {
			loading = false;

			toast.error(String(ex));

			console.error(ex);
		}
	};

	let otpInput = $state<string>("");
	const otpInputHandler = (val: string) => {
		otpInput = val;
	};

	const signIn = async () => {
		if (otpInput.length !== 6) {
			toast.error("Your OTP is too short!");
			return;
		}

		toast.info("Signing you in...");

		try {
			loading = true;
			const req = await fetch("/api/si", {
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({
					label,
					id: inputValue.replace("#", ""),
					otp: Number(otpInput),
					isApp: data.isApp,
				}),
			});

			const res = await req.json();

			loading = false;

			if (res.success) {
				toast.success(res.message);
				goto(res.redirect);
				return;
			}

			toast.error(res.message);
		} catch (ex: any) {
			const message =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex?.message || JSON.stringify(ex);

			toast.error(message);
		}
	};

	$effect(() => {
		if (otpInput.length === 6) signIn();
	});

	let year = new Date().getFullYear();

	// cleanup all caches
	onMount(() => {
		portfolioCacheStore.set({});
	});
</script>

<Head
	title="Sign In | SBZ Digital"
	ogTitle="Sign In"
	description="Sign in and take control of your portfolio!"
	ogDescription="Sign in and take control of your portfolio!"
	token={$isAppStore}
/>

{#if data.isApp}
	<div class="app"></div>
{/if}
<div class="tainer">
	<div class="img">
		<img src="/img/sign-in.png" alt="infographic" />
		<h2>Sign In</h2>
		<p class="text-center">Sign in and take control of the market and your holdings.</p>
	</div>

	<div class="signin">
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			{#if !otpLayout}
				<Label>{label}</Label>
				<Input
					class="num"
					{placeholder}
					bind:value={inputValue}
					disabled={loading}
					onkeypress={(e) => {
						if (e.key === "#" && !inputValue.length) changeToAdmin();
						if (e.key === "Enter") sendOtp();
					}}
					oninput={(e) => {
						//@ts-ignore
						valueHandler(e.target.value);
					}}
					inputmode={$isAppStore ? "numeric" : undefined}
				/>
				<p class="text-justify text-sm text-muted-foreground">
					{description}
				</p>
			{:else}
				<Label class="mb-3">Enter Your OTP</Label>
				<OTP bind:disabled={loading} handler={otpInputHandler} />
				<p class="mt-3 text-justify text-sm text-muted-foreground">Check your email.</p>
			{/if}
		</div>

		{#if !otpLayout}
			<Button class="mt-6" disabled={buttonDisabled || loading} onclick={() => sendOtp()}
				>Get OTP</Button
			>
		{/if}

		<p class="mt-8 text-justify text-sm">
			Don't have an account? <span class="font-bold italic"><a href="/sign-up">Sign Up.</a></span>
		</p>

		<p class="mt-4 text-justify text-sm">
			Got Questions? <span class="font-bold italic"><a href="/contact">Contact Us.</a></span>
		</p>

		<div class="footer">
			<p>
				Built by <a href="https://www.neos.finance" target="_blank" rel="noopener">Neos FinTech</a>
			</p>
			<p class="mb-10">© {year} Broking Engine, All Rights Reserved</p>
		</div>
	</div>
</div>
{#if data.isApp}
	<div class="app"></div>
{/if}

<style lang="scss">
	.tainer {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: row;
		padding: 0px;
		position: relative;
		overflow-y: hidden;

		@media screen and (max-width: 768px) {
			flex-direction: column;
		}

		.img {
			width: 50%;
			background-color: var(--muted);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			img {
				width: auto;
				height: 40%;
			}

			h2 {
				margin-top: 30px;
			}

			@media screen and (max-width: 768px) {
				width: 100%;
				height: 50%;

				img {
					height: 60%;
				}

				h2 {
					margin-top: 10px;
				}
			}
		}

		.signin {
			width: 50%;
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			@media screen and (max-width: 768px) {
				width: 80%;
				height: 50%;
				margin: 0px auto;
			}
		}

		.footer {
			text-align: center;
			font-size: 9pt;
			opacity: 0.5;
			position: absolute;
			top: 93%;
		}
	}
</style>
