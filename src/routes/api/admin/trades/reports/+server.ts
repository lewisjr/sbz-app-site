import { DEV } from "$env/static/private";
import kratos from "$lib/server/kratos";

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const isProd = DEV !== "y";

	const { html }: { html: string } = await request.json();

	let generatedHtml = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
            <style>
                * {
                    box-sizing: border-box;
                    font-family: "Montserrat", sans-serif;
                    font-feature-settings: normal;
                    font-variation-settings: normal;
                }
                *.num {
                    font-family: "Google Sans Code", monospace !important;
                }
				body {
					margin: 0;
					padding: 0;
				}
				.page {
		color: black !important;
		width: 21cm;
		height: 29.7cm;
		background-color: white;
		padding: 1.5cm 1cm;
		font-family: "Nunito", sans-serif;
		position: relative;
	}

	.page .top {
		width: 100%;
		border-top: 1px solid black;
		border-bottom: 1px solid black;
	}

	.top img {
		width: 2cm;
		height: auto;
		margin-left: 10px;
	}

	.top td p {
		text-align: end;
		margin: 0px;
        padding: 0px;
	}

	.top td p.title {
		font-weight: bold;
		font-size: 14pt;
	}

	.top td p.exchange {
		font-weight: 400;
		font-size: 14pt;
	}

	.top td p.date {
		font-weight: 400;
		font-style: italic;
		font-size: 12pt;
	}

	.trade-summary {
		width: 100%;
		table-layout: fixed;
        border-collapse: collapse;
	}

	.trade-summary thead tr:nth-child(1) {
		border-top: 1px solid black;
		border-bottom: 1px dashed black;
	}

	.trade-summary thead tr:nth-child(2) {
		border-bottom: 1px solid black;
	}

	.trade-summary td,
	.trade-summary th {
		padding: 3px 0px;
	}

	.trade-summary tbody tr:nth-child(even) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.trades-total {
		background-color: transparent !important;
	}

	.pnum {
		position: absolute;
		width: 21cm;
		text-align: center;
		bottom: 60px;
		font-size: 10pt;
		left: 0px;
	}
			</style>
		</head>
		<body>
				${html}
		</body>
		</html>
	`;

	console.log(generatedHtml);

	const fullHtml = generatedHtml;

	const pupLib = isProd
		? (await import("puppeteer-core")).default
		: (await import("puppeteer")).default;

	let browser: any | undefined = undefined;

	if (isProd) {
		const chromium = (await import("@sparticuz/chromium-min")).default;
		browser = await pupLib.launch({
			args: [...chromium.args, "--disable-dev-shm-usage"],
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(
				"https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar",
			),
			headless: true,
			// @ts-ignore
			ignoreHTTPSErrors: true,
		});
	} else {
		browser = await pupLib.launch({ headless: true });
	}

	const page = await browser.newPage();

	await page.setContent(fullHtml, {
		waitUntil: ["networkidle0", "domcontentloaded"],
		timeout: 30000,
	});

	let pdf: any | undefined = undefined;

	pdf = await page.pdf({
		format: "A4",
		printBackground: true,
	});

	await browser.close();

	return new Response(pdf, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": 'inline; filename="report.pdf"', // Use 'inline' for viewing in new tab
		},
	});
};
