<script lang="ts">
	//stores
	import { page } from "$app/state";

	//icons
	import {
		ChevronRight,
		Home,
		ClipboardPlus,
		UserRoundCog,
		Database,
		RectangleEllipsis,
		MessageCircleQuestion,
	} from "@lucide/svelte";

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

	interface Props {
		permissions: string[];
	}

	let { permissions }: Props = $props();
</script>

<button
	class={`${mode} cursor-pointer`}
	on:click={() => changeMode()}
	title={mode === "hid" ? `Open Menu` : "Close Menu"}
>
	<span class={mode}><ChevronRight /></span>
</button>

<div class={`shadow ${mode}`}></div>

<div class={`navbar ${mode}`}>
	<!-- Logo Part -->
	<a class="logo" href="/admin/home">
		<img class="h-[60px] w-[60px]" src="/img/logo-bull.png" alt="sbz-logo" />
	</a>

	<!-- Actual Links -->
	<a class={`link${path === "/admin/home" ? " current" : ""}`} href="/admin/home">
		<Home class="h-8 w-8" />
		<p>Home</p>
	</a>

	<div class="titl">
		<p>Odyn</p>
	</div>

	<a class={`link${path === "/admin/tickets" ? " current" : ""}`} href="/admin/tickets">
		<MessageCircleQuestion class="h-8 w-8" />
		<p>Tickets</p>
	</a>

	<div class="titl">
		<p>System</p>
	</div>

	<a class={`link${path === "/admin/staff" ? " current" : ""}`} href="/admin/staff">
		<UserRoundCog class="h-8 w-8" />
		<p>Staff</p>
	</a>

	<a class={`link${path === "/admin/otps" ? " current" : ""}`} href="/admin/otps">
		<RectangleEllipsis class="h-8 w-8" />
		<p>OTPs</p>
	</a>

	<a class={`link${path === "/admin/logs" ? " current" : ""}`} href="/admin/logs">
		<Database class="h-8 w-8" />
		<p>Logs</p>
	</a>
</div>

<style lang="scss">
	* {
		&::-webkit-scrollbar {
			width: 3px;
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

		&.hid {
			left: -70px;
		}

		&.vis {
			left: 0px;
		}

		a {
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

	button {
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
		font-size: 9pt;
		font-weight: 600;
		margin-bottom: 11px;
		margin-top: -5px;
		text-align: center;

		p {
			opacity: 0.5;
		}
	}
</style>
