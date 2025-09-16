<script lang="ts">
	//stores
	import { screenWidthStore } from "$lib/stores";

	//components - custom
	import Head from "$lib/components/Head.svelte";
	import Lottie from "$lib/components/Lottie.svelte";

	//components - shadcn
	import Button from "$lib/components/ui/button/button.svelte";

	//animations
	import klineAnim from "$lib/lotties/klineAnim.json";
	import portfolioAnim from "$lib/lotties/portfolioAnim.json";
	import screenerAnim from "$lib/lotties/screenerAnim.json";
	import sensAnim from "$lib/lotties/sensAnim.json";
	import iAanim from "$lib/lotties/iAanim.json";

	//icons
	import { Facebook, Linkedin, Youtube, MessageCircle, LogIn } from "@lucide/svelte";

	$: isMobile = $screenWidthStore < 768;
	$: year = new Date().getFullYear();
</script>

<Head
	title="Get Started | SBZ Digital"
	ogTitle="Get Started"
	description="Begin or continue your investment journey online; Create an account to get market data, monitor your portfolio and trades, and trade!"
	ogDescription="Begin or continue your investment journey online; Create an account to get market data, monitor your portfolio and trades, and trade!"
/>

<div class="tainer">
	<header>
		<div class="flex flex-row items-center">
			<img class="h-[60px] w-[60px]" src="/img/logo-bull.png" alt="sbz-logo" />
			<h3 class="ml-2">SBZ Digital</h3>
		</div>

		{#if !isMobile}
			<div class="links">
				<div class="link">
					<a href="#stock">Market Data</a>
				</div>

				<div class="link">
					<a href="#portfolio">Portfolio Analysis</a>
				</div>

				<div class="link">
					<a href="#screener">Screener</a>
				</div>

				<div class="link">
					<a href="#news">News</a>
				</div>

				<div class="link">
					<a href="#advisory">Advisory</a>
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
	</header>

	<section id="stock" class="content reverse">
		<div class={`${!isMobile ? "w-[80%]" : "w-[100%]"}`}>
			<h3>Intelligent Market Data</h3>
			<p>All the information you need at your fingertips to make informed decisions.</p>
		</div>
		<Lottie
			animationData={klineAnim}
			height={isMobile ? undefined : 350}
			explicitWidth={isMobile ? undefined : 100}
			bindRight
		/>
	</section>

	<section id="portfolio" class="content">
		<Lottie
			animationData={portfolioAnim}
			height={isMobile ? undefined : 350}
			explicitWidth={isMobile ? undefined : 100}
			bindLeft
		/>
		<div class={`${!isMobile ? "w-[80%]" : "w-[100%]"}`}>
			<h3>Portfilio Analysis</h3>
			<p>Learn the hidden truths about your portfolio, and act on empirical data.</p>
		</div>
	</section>

	<section id="screener" class="content reverse">
		<div class={`${!isMobile ? "w-[80%]" : "-mt-10 w-[100%]"}`}>
			<h3>Stock Screener</h3>
			<p>Cancel out the noise and see what matters to you.</p>
		</div>
		<Lottie
			animationData={screenerAnim}
			height={isMobile ? undefined : 350}
			explicitWidth={isMobile ? undefined : 100}
			bindRight
		/>
	</section>

	<section id="news" class="content">
		<Lottie
			animationData={sensAnim}
			height={isMobile ? undefined : 350}
			explicitWidth={isMobile ? undefined : 100}
			bindLeft
		/>
		<div class={`${!isMobile ? "w-[80%]" : "w-[100%]"}`}>
			<h3>Never Miss a Beat</h3>
			<p>
				Subscribe to the <u><i>LuSE SENS</i></u> to get up to date market news... <b>always</b>!
			</p>
		</div>
	</section>

	<section id="advisory" class="content reverse">
		<div class={`${!isMobile ? "w-[80%]" : "-mt-10 w-[100%]"}`}>
			<h3>Feeling Stuck?</h3>
			<p>Get advice from a SEC licensed advisor on your portfolio.</p>
		</div>
		<Lottie
			animationData={iAanim}
			height={isMobile ? undefined : 350}
			explicitWidth={isMobile ? undefined : 100}
			bindRight
		/>
	</section>

	<div class="divider"></div>

	<section class="content">
		<div class="-mt-10 w-[100%]">
			<h3>What's the Holdup?</h3>
			<p>Create your account <b>NOW</b> and take your investments to the next level!</p>
			<Button
				href="/sign-in"
				style="text-decoration: none; font-weight: 600;"
				class="mt-5 text-white">Get Started<LogIn class="ml-1 h-4 w-4" /></Button
			>
		</div>
	</section>

	<section class="content">
		<div class="w-[100%]">
			<h3>Need Assistance?</h3>
			<p>
				Get in touch with us to ask any questions you have, response time is usually within 24
				hours.
			</p>
			<Button
				href="/contact"
				variant="outline"
				style="text-decoration: none; font-weight: 600;"
				class="mt-5 text-white">Contact<MessageCircle class="ml-1 h-4 w-4" /></Button
			>
		</div>
	</section>

	<section class="content py-10" style="background-color: hsl(var(--secondary));">
		<div class="w-[100%]">
			<p class="mb-10">
				This service is an official offering from <a href="https://www.sbz.com.zm" target="_blank"
					>Stockbrokers Zambia Limited</a
				>
			</p>
			<div
				class={isMobile
					? "flex flex-row justify-around"
					: "flex w-[100%] flex-row items-center justify-center"}
			>
				<Button variant="outline" href="https://www.facebook.com/sbzltd" target="_blank"
					><Facebook /></Button
				>
				<Button
					variant="outline"
					class={isMobile ? undefined : "ml-5"}
					href="https://www.linkedin.com/company/sbzm"
					target="_blank"><Linkedin /></Button
				>
				<Button
					variant="outline"
					class={isMobile ? undefined : "mx-5"}
					href="https://www.youtube.com/@stockbrokerszm"
					target="_blank"><Youtube /></Button
				>
			</div>
		</div>
	</section>

	<footer>
		<p>Built by <a href="https://www.neos.finance" target="_blank">Neos FinTech</a></p>
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

	.content {
		width: 100%;
		margin: 40px 0px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		position: relative;

		h3 {
			margin-top: 30px;
			margin-bottom: 10px;
		}

		@media screen and (min-width: 769px) {
			h3 {
				font-size: 25pt;
			}

			p {
				font-size: 15pt;
			}
		}

		@media screen and (max-width: 768px) {
			&.reverse {
				flex-direction: column-reverse;
			}

			flex-direction: column;
		}
	}

	.divider {
		width: 68%;
		height: 1px;
		background-color: hsl(var(--foreground));
		margin: 0px auto;
		opacity: 0.4;
		margin-bottom: 70px;
	}

	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0.7;
	}
</style>
