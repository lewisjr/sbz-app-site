<script lang="ts">
	//functions
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";

	//stores
	import { page } from "$app/state";

	//icons
	import {
		ChevronRight,
		House,
		ChartCandlestick,
		NotebookText,
		LogOut,
		Wallet,
		FolderClock,
		Settings,
	} from "@lucide/svelte";

	//types
	import type { GenericResponse } from "$lib/types";

	let mode = $state<"hid" | "vis">("hid");

	const changeMode = () => {
		switch (mode) {
			case "hid":
				mode = "vis";
				return;
			case "vis":
				mode = "hid";
				return;
			default:
				return;
		}
	};

	let path = $derived(page.url.pathname);

	let loading = $state<boolean>(false);

	const signOut = async () => {
		loading = true;
		toast.info("Signing you out...");

		try {
			const req = await fetch("/api/si", {
				method: "DELETE",
			});

			const res: GenericResponse = await req.json();

			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			goto("/sign-in");
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

	$effect(() => {
		if (page.url.pathname) {
			mode = "hid";
		}
	});
</script>

<button
	class={`${mode} button cursor-pointer`}
	onclick={() => changeMode()}
	title={mode === "hid" ? `Open Menu` : "Close Menu"}
>
	<span class={mode}><ChevronRight /></span>
</button>

<div class={`shadow ${mode}`}></div>

<div class={`navbar ${mode}`}>
	<!-- Logo Part -->
	<a class="logo" href="/d/home">
		<img class="h-[60px] w-[60px]" src="/img/logo-bull.png" alt="sbz-logo" />
	</a>

	<!-- Actual Links -->
	<a class={`link${path === "/d/home" ? " current" : ""}`} href="/d/home">
		<House class="h-8 w-8" />
		<p>Home</p>
	</a>

	<!-- Market -->
	<div class="titl">
		<p>Stocks</p>
	</div>

	<a class={`link${path === "/d/market" ? " current" : ""}`} href="/d/market">
		<ChartCandlestick class="h-8 w-8" />
		<p>Market</p>
	</a>

	<a class={`link${path === "/d/news" ? " current" : ""}`} href="/d/news">
		<NotebookText class="h-8 w-8" />
		<p>News</p>
	</a>

	<!-- SBZ Specific -->
	<div class="titl">
		<p>Account</p>
	</div>

	<!--

	<a class={`link${path === "/d/wallet" ? " current" : ""}`} href="/d/wallet">
		<Wallet class="h-8 w-8" />
		<p>Wallet</p>
	</a>

	<a class={`link${path === "/d/history" ? " current" : ""}`} href="/d/history">
		<FolderClock class="h-8 w-8" />
		<p>History</p>
	</a>

	<a class={`link${path === "/d/settings" ? " current" : ""}`} href="/d/settings">
		<Settings class="h-8 w-8" />
		<p>Settings</p>
	</a>

	-->

	<button class="battan link" onclick={signOut} disabled={loading}>
		<LogOut class="h-8 w-8" />
		<p>Sign Out</p>
	</button>
</div>

<style lang="scss">
	* {
		&::-webkit-scrollbar {
			width: 7px;
			display: none;
		}
	}

	.shadow {
		width: 70px;
		height: 100%;
		position: fixed;
		z-index: 97;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		box-shadow: 0px 0px 9px var(--shadow);

		&.hid {
			left: -70px;
		}

		&.vis {
			left: 0px;
		}
	}

	.navbar {
		width: 70px;
		height: 100%;
		position: fixed;
		z-index: 99;
		background-color: var(--secondary);
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;

		&:hover {
			&::-webkit-scrollbar {
				display: block;
			}
		}

		&.hid {
			left: -70px;
		}

		&.vis {
			left: 0px;
		}

		a,
		.battan {
			text-decoration: none;
			position: relative;
			z-index: 103;

			&.logo {
				margin-top: 10px;
				margin-bottom: 15px;
			}

			&.link {
				width: 58px;
				height: fit-content;
				display: flex;
				flex-direction: column;
				align-items: center;
				border-radius: var(--radius);
				border: 2px solid transparent;
				color: var(--foreground);
				padding: 5px 0px;
				margin-bottom: 15px;

				&:hover {
					background-color: var(--primary) !important;
					color: #f7f7f7 !important;

					&:disabled {
						background-color: #7d7d7d !important;
					}
				}

				&.current {
					border: 2px solid var(--primary);
				}

				p {
					font-size: 9pt;
					text-decoration: none;
					user-select: none;
				}
			}
		}
	}

	.button {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		position: fixed;
		height: 50px;
		width: 50px;
		background-color: var(--secondary);
		border-radius: 50%;
		z-index: 99;
		top: 50%;
		transform: translateY(-50%);

		&.hid {
			left: -30px;
		}

		&.vis {
			left: 35px;
		}

		.hid {
			transform: rotateY(0deg);
			user-select: none;
		}

		.vis {
			transform: rotateY(180deg);
			user-select: none;
		}
	}

	.titl {
		min-width: 41%;
		padding-bottom: 5px;
		border-bottom: 1px solid var(--foreground);
		font-size: 8pt;
		font-weight: 600;
		margin-bottom: 11px;
		margin-top: -5px;
		text-align: center;
		user-select: none;

		p {
			opacity: 0.5;
		}
	}
</style>
