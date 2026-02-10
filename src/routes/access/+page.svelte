<script lang="ts">
	import Head from "$lib/components/Head.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { setMode } from "mode-watcher";

	setMode("dark");
</script>

<Head
	title="Download The App | SBZ Digital"
	ogTitle="Download The App"
	description="Android? iPhone? Web? We got you covered!"
	ogDescription="Android? iPhone? Web? We got you covered!"
/>

<section class="tainer">
	<img class="logo" src="/img/digital.png" alt="SBZ Digital Icon" />
	<h3 class="fin-2">Stockbrokers Zambia Limited</h3>
	<p class="fin-3">Your guide and partner into the Zambian frontier capital markets.</p>
	<table class="fin-4 mt-3 max-w-[400px]">
		<tbody>
			<tr>
				<td colspan="2"><h2 style="font-size: 14pt;">Manage Your Portfolio</h2></td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://apps.apple.com/zm/app/sbz-digital/id6758521941"
							><img class="h-7 w-7" src="/img/apple.png" alt="app store icon" />App Store</Button
						>
					</div>
				</td>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://play.google.com/store/apps/details?id=zm.com.sbz.app"
							><img class="h-7 w-7" src="/img/-_google.png" alt="google play icon" />Play Store</Button
						>
					</div>
				</td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							style="text-decoration: none;"
							variant="outline"
							href="https://app.sbz.com.zm/sign-in"
							><img class="h-7 w-7" src="/img/-_web.png" alt="web icon" />Web Portal</Button
						>
					</div>
				</td>
			</tr>
		</tbody>
	</table>

	<table class="fin-5 mt-3 max-w-[400px]">
		<tbody>
			<tr>
				<td colspan="2"><h2 style="font-size: 14pt;">Chat With Us</h2></td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://wa.me/260775438571"
							><img
								class="h-7 w-7"
								src="/img/-_whatsapp.png"
								alt="app store icon"
							/>WhatsApp</Button
						>
					</div>
				</td>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://app.sbz.com.zm/contact"
							><img class="h-7 w-7" src="/img/-_chat.png" alt="chat icon" />Speak to a Broker</Button
						>
					</div>
				</td>
			</tr>
		</tbody>
	</table>

	<table class="fin-6 mt-3 max-w-[400px]">
		<tbody>
			<tr>
				<td colspan="2"><h2 style="font-size: 14pt;">Useful Documents</h2></td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://web.facebook.com/sbzltd"
							><img class="h-7 w-7" src="/img/-_fb.png" alt="fb icon" />Facebook</Button
						>
					</div>
				</td>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://www.linkedin.com/company/sbzm"
							><img class="h-7 w-7" src="/img/-_chat.png" alt="linkedin icon" />LinkedIn</Button
						>
					</div>
				</td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://www.youtube.com/@stockbrokerszm"
							><img class="h-7 w-7" src="/img/-_yt.png" alt="yt icon" />YouTube</Button
						>
					</div>
				</td>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://creators.spotify.com/pod/profile/stockbrokers-zambia"
							><img class="h-7 w-7" src="/img/-_spotify.png" alt="spotify icon" />Podcast</Button
						>
					</div>
				</td>
			</tr>
		</tbody>
	</table>

	<table class="fin-7 mt-3 max-w-[400px]">
		<tbody>
			<tr>
				<td colspan="2"><h2 style="font-size: 14pt;">Useful Documents</h2></td>
			</tr>
			<tr>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://www.sbz.com.zm/subscribe-to-daily-market-reports"
							><img class="h-7 w-7" src="/img/-_docs.png" alt="docs icon" />Reports</Button
						>
					</div>
				</td>
				<td
					><div class="flex flex-col items-center px-3 py-3">
						<Button
							target="_blank"
							style="text-decoration: none;"
							variant="outline"
							href="https://www.sbz.com.zm/subscribe-to-daily-market-reports"
							><img class="h-7 w-7" src="/img/-_mail.png" alt="linkedin icon" />Newsletter</Button
						>
					</div>
				</td>
			</tr>
		</tbody>
	</table>

	<div class="fin-8 mx-auto w-[98%]">
		<p class="mt-6 text-justify text-sm text-muted-foreground">
			<b>Lusaka</b><br />36 Mwapona Road, Woodlands, Lusaka, Zambia<br />+260 211 232456
		</p>

		<p class="mt-6 text-justify text-sm text-muted-foreground">
			<b>Kitwe</b><br />Ebenezer Centre, Plot 33 - C2<br />Cnr. Kabengele Road & Independence Avenue<br
			/>Kitwe, Zambia<br />+260 212 225984
		</p>

		<p class="mt-6 text-justify text-sm text-muted-foreground">
			A licensed Stockbroking firm providing Corporate finance & Investment Advisory.
		</p>

		<p class="my-6 text-justify text-sm text-muted-foreground">
			Powered by <a href="https://www.neos.finance" target="_blank" rel="noopener">Neos FinTech</a>
		</p>
	</div>
</section>

<style lang="scss">
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	* {
		text-align: center;
	}

	.tainer {
		width: 100%;
		height: 100%;
		padding: 0px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;

		.logo {
			width: 150px;
			height: auto;
			opacity: 0;
			animation: fade-in 1000ms ease-in-out forwards;
		}

		.fin-2 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 300ms;
			margin-top: -30px;
		}

		.fin-3 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 600ms;
		}

		.fin-4 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 900ms;
		}

		.fin-5 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 1200ms;
		}

		.fin-6 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 1500ms;
		}

		.fin-7 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 1800ms;
		}

		.fin-8 {
			opacity: 0;
			animation: fade-in 500ms ease-in-out forwards;
			animation-delay: 2100ms;
		}
	}
</style>
