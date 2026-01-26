import dbs from "$lib/server/db/index.js";
import kratos from "$lib/server/kratos";
import { prettyDate, print } from "$lib/utils";
import { toTitleCase } from "@cerebrusinc/fstring";
import { numParse } from "@cerebrusinc/qol";
import { json } from "@sveltejs/kit";

import { DEV } from "$env/static/private";

const isProd = DEV !== "y";

export const POST = async (event) => {
	const client = await kratos.client(event);
	if (client instanceof Response) return client;

	console.log("hit");

	const { date }: { date: number } = await event.request.json();

	try {
		const matched = await dbs.nf.getMatchedTrades(client.luseId);

		if (!matched.trades.length) {
			print({ matched });
			return json(
				{ success: false, message: `Failed to get trades for ${prettyDate(date)}.` },
				{ status: 400 },
			);
		}

		const applicableMatched = matched.trades.filter((item) => item.trade_date === date);

		applicableMatched.sort((a, b) => b.trade_date - a.trade_date);

		/*
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"><style>* {box-sizing: border-box;font-family: "Montserrat", sans-serif;font-feature-settings: normal;font-variation-settings: normal;}*.num {font-family: "Google Sans Code", monospace !important;}body {margin: 0;padding: 0;}.page {color: black !important;width: 21cm;height: 29.7cm;background-color: white;padding: 1.5cm 1cm;font-family: "Nunito", sans-serif;position: relative;}.page .top {width: 100%;border-top: 1px solid black;border-bottom: 1px solid black;}.top img {width: 2cm;height: auto;margin-left: 10px;}.top td p {text-align: end;text-align: end;margin: 0px;padding: 0px;}.top td p.title {font-weight: bold;font-size: 14pt;}.top td p.exchange {font-weight: 400;font-size: 14pt;}.top td p.date {font-weight: 400;font-style: italic;font-size: 12pt;}.trade-summary {width: 100%;table-layout: fixed;border-collapse: collapse;}.trade-summary thead tr:nth-child(1) {border-top: 1px solid black;border-bottom: 1px dashed black;}.trade-summary thead tr:nth-child(2) {border-bottom: 1px solid black;}.trade-summary td,.trade-summary th {padding: 3px 0px;}.trade-summary tbody tr:nth-child(even) {background-color: rgba(0, 0, 0, 0.1);}.trades-total {background-color: transparent !important;}.pnum {position: absolute;width: 21cm;text-align: center;bottom: 60px;font-size: 10pt;left: 0px;}.contact-btm {position: absolute;width: 19cm;padding: 5px 0px;text-align: center;bottom: 25px;font-size: 10pt;left: 1cm;display: flex;flex-direction: row;white-space: nowrap;align-items: center;justify-content: center;opacity: 0.7;font-style: italic;border-top: 1px solid black;}</style></head><body><section class="page s-0rbs-W95zBjf"><table class="top s-0rbs-W95zBjf"><tbody class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><td class="s-0rbs-W95zBjf"><img alt="sbz logo" class="s-0rbs-W95zBjf" src="https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/sbz/no%20alpha%20sbz%20logo.png"></td><td class="s-0rbs-W95zBjf"><p class="title s-0rbs-W95zBjf">Trade Report</p> <p class="exchange s-0rbs-W95zBjf">${prettyDate(date)}</p><p class="date s-0rbs-W95zBjf">${client.luseId} - ${toTitleCase(client.fname + " " + client.lname)}</p></td></tr></tbody></table> <p style="margin-top: 10px; margin-bottom: 20px;" class="s-0rbs-W95zBjf">Please take a look at your matched trades over the above stated period in the table</p></td></tr></tbody></table> <p style="margin-top: 10px; margin-bottom: 20px;" class="s-0rbs-W95zBjf">Please take a look at your matched trades over the above stated period in the table below.</p><table class="trade-summary s-0rbs-W95zBjf"><thead class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><th colspan="5" class="s-0rbs-W95zBjf">ZMW Trades</th></tr><tr class="s-0rbs-W95zBjf"><th style="text-align: left;" class="s-0rbs-W95zBjf">Side</th><!----><th class="s-0rbs-W95zBjf">Symbol</th><th class="s-0rbs-W95zBjf">Price</th><th class="s-0rbs-W95zBjf">Quantity</th><th style="text-align: right;" class="s-0rbs-W95zBjf">Total</th></tr></thead><tbody class="s-0rbs-W95zBjf">`

    const zmw = applicableMatched.filter(item => !item.symbol.toLowerCase().includes("usd"));

    zmw.forEach(trade => {
        html += `<tr class="s-0rbs-W95zBjf"><td style="text-align: left;" class="s-0rbs-W95zBjf">${toTitleCase(toTitleCase(trade.trade_side))}</td><td style="text-align: center;" class="s-0rbs-W95zBjf">${trade.symbol}</td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.price.toFixed(2))}</span></td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.qty)}</span></td><td style="text-align: right;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse((trade.price * trade.qty).toFixed(2))}</span></td></tr>`
    })

    const usd = applicableMatched.filter(item => item.symbol.toLowerCase().includes("usd"))

    if (usd.length) {
        html += `<table class="trade-summary s-0rbs-W95zBjf" style="margin-top: 20px;"><thead class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><th colspan="5" class="s-0rbs-W95zBjf">USD Trades</th></tr><tr class="s-0rbs-W95zBjf"><th style="text-align: left;" class="s-0rbs-W95zBjf">Side</th><!----><th class="s-0rbs-W95zBjf">Symbol</th><th class="s-0rbs-W95zBjf">Price</th><th class="s-0rbs-W95zBjf">Quantity</th><th style="text-align: right;" class="s-0rbs-W95zBjf">Total</th></tr></thead><tbody class="s-0rbs-W95zBjf">`;

        usd.forEach(trade => {
            html += `<tr class="s-0rbs-W95zBjf"><td style="text-align: left;" class="s-0rbs-W95zBjf">${toTitleCase(toTitleCase(trade.trade_side))}</td><td style="text-align: center;" class="s-0rbs-W95zBjf">${trade.symbol}</td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.price.toFixed(2))}</span></td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.qty)}</span></td><td style="text-align: right;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse((trade.price * trade.qty).toFixed(2))}</span></td></tr>`
        })
    }

    html += `<p class="pnum s-0rbs-W95zBjf" style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"><span class="s-0rbs-W95zBjf">Prepared by Lewis</span> <span class="s-0rbs-W95zBjf">1</span></p> <p class="contact-btm s-0rbs-W95zBjf"><!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-map-pin" style="height: 20px; width: 20px;"><!----><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><!----><circle cx="12" cy="10" r="3"></circle><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">36 Mwapona Road, Woodlands, Lusaka, Zambia</span> <!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-phone" style="height: 20px; width: 20px;"><!----><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">+260 212 225984 / +260 211 232456</span> <!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-mail" style="height: 20px; width: 20px;"><!----><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><!----><rect x="2" y="4" width="20" height="16" rx="2"></rect><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">info@sbz.com.zm</span></p></section></body></html>`
    */

		let _html = `<section class="page s-0rbs-W95zBjf"><table class="top s-0rbs-W95zBjf"><tbody class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><td class="s-0rbs-W95zBjf"><img alt="sbz logo" class="s-0rbs-W95zBjf" src="https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/sbz/no%20alpha%20sbz%20logo.png"></td><td class="s-0rbs-W95zBjf"><p class="title s-0rbs-W95zBjf">Trade Report</p> <p class="exchange s-0rbs-W95zBjf">${prettyDate(date)}</p><p class="date s-0rbs-W95zBjf">${client.luseId} - ${toTitleCase(client.fname + " " + client.lname)}</p></td></tr></tbody></table> <p style="margin-top: 10px; margin-bottom: 20px;" class="s-0rbs-W95zBjf">Please take a look at your matched trades over the above stated period in the table</p></td></tr></tbody></table> <p style="margin-top: 10px; margin-bottom: 20px;" class="s-0rbs-W95zBjf">Please take a look at your matched trades over the above stated period in the table below.</p><table class="trade-summary s-0rbs-W95zBjf"><thead class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><th colspan="5" class="s-0rbs-W95zBjf">ZMW Trades</th></tr><tr class="s-0rbs-W95zBjf"><th style="text-align: left;" class="s-0rbs-W95zBjf">Side</th><!----><th class="s-0rbs-W95zBjf">Symbol</th><th class="s-0rbs-W95zBjf">Price</th><th class="s-0rbs-W95zBjf">Quantity</th><th style="text-align: right;" class="s-0rbs-W95zBjf">Total</th></tr></thead><tbody class="s-0rbs-W95zBjf">`;

		const _zmw = applicableMatched.filter((item) => !item.symbol.toLowerCase().includes("usd"));

		_zmw.forEach((trade) => {
			_html += `<tr class="s-0rbs-W95zBjf"><td style="text-align: left;" class="s-0rbs-W95zBjf">${toTitleCase(toTitleCase(trade.trade_side))}</td><td style="text-align: center;" class="s-0rbs-W95zBjf">${trade.symbol}</td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.price.toFixed(2))}</span></td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.qty)}</span></td><td style="text-align: right;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse((trade.price * trade.qty).toFixed(2))}</span></td></tr>`;
		});

		const _usd = applicableMatched.filter((item) => item.symbol.toLowerCase().includes("usd"));

		if (_usd.length) {
			_html += `<table class="trade-summary s-0rbs-W95zBjf" style="margin-top: 20px;"><thead class="s-0rbs-W95zBjf"><tr class="s-0rbs-W95zBjf"><th colspan="5" class="s-0rbs-W95zBjf">USD Trades</th></tr><tr class="s-0rbs-W95zBjf"><th style="text-align: left;" class="s-0rbs-W95zBjf">Side</th><!----><th class="s-0rbs-W95zBjf">Symbol</th><th class="s-0rbs-W95zBjf">Price</th><th class="s-0rbs-W95zBjf">Quantity</th><th style="text-align: right;" class="s-0rbs-W95zBjf">Total</th></tr></thead><tbody class="s-0rbs-W95zBjf">`;

			_usd.forEach((trade) => {
				_html += `<tr class="s-0rbs-W95zBjf"><td style="text-align: left;" class="s-0rbs-W95zBjf">${toTitleCase(toTitleCase(trade.trade_side))}</td><td style="text-align: center;" class="s-0rbs-W95zBjf">${trade.symbol}</td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.price.toFixed(2))}</span></td><td style="text-align: center;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse(trade.qty)}</span></td><td style="text-align: right;" class="s-0rbs-W95zBjf"><span class="num s-0rbs-W95zBjf">${numParse((trade.price * trade.qty).toFixed(2))}</span></td></tr>`;
			});
		}

		_html += `<p class="pnum s-0rbs-W95zBjf" style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; padding: 0px 1cm;"><span class="s-0rbs-W95zBjf">Prepared by SBZ Digital</span> <span class="s-0rbs-W95zBjf">1</span></p> <p class="contact-btm s-0rbs-W95zBjf"><!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-map-pin" style="height: 20px; width: 20px;"><!----><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><!----><circle cx="12" cy="10" r="3"></circle><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">36 Mwapona Road, Woodlands, Lusaka, Zambia</span> <!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-phone" style="height: 20px; width: 20px;"><!----><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">+260 212 225984 / +260 211 232456</span> <!----><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-mail" style="height: 20px; width: 20px;"><!----><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><!----><rect x="2" y="4" width="20" height="16" rx="2"></rect><!----><!----><!----></svg><!----> <span style="margin-right: 10px;" class="s-0rbs-W95zBjf">info@sbz.com.zm</span></p></section></body></html>`;

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

    .contact-btm {
        position: absolute;
        width: 19cm;
        padding: 5px 0px;
        text-align: center;
        bottom: 25px;
        font-size: 10pt;
        left: 1cm;
        display: flex;
        flex-direction: row;
        white-space: nowrap;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        font-style: italic;
        border-top: 1px solid black;
    }
            </style>
        </head>
        <body>
                ${_html}
        </body>
        </html>
    `;

		//console.log(generatedHtml);

		const fullHtml = generatedHtml;

		// console.log({ generatedHtml });

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
				"Content-Disposition": `inline; filename="${client.luseId} Trade Report ${prettyDate(date)}.pdf"`, // Use 'inline' for viewing in new tab
			},
		});
	} catch (ex) {
		console.error("\n\n", ex, "\n\n");
		return json({ success: false, message: "Failed to generate your report." }, { status: 500 });
	}
};
