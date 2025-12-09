import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import { PdfReader } from "pdfreader";
import dbs from "$lib/server/db";
import loadWasm from "$lib/wasm/load";

import type { SettledTradeInsert } from "$lib/types";

/**Based on the document after adding REIS USD; Testing doc used was for 23 Dec 2024 */
const readSettle = (fileBuffer: Buffer): Promise<false | string> => {
	const pdfReader = new PdfReader();

	return new Promise((resolve, reject) => {
		let docText: string = "";

		pdfReader.parseBuffer(fileBuffer, (ex, d) => {
			if (ex) {
				console.log(ex);
				resolve(false);
			} else if (!d) {
				resolve(docText);
			} else {
				if (d.text) {
					docText += d.text;
				}
			}
		});
	});
};

export const PUT = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const wasm = await loadWasm();

	if (!wasm)
		return json(
			{
				success: false,
				message: "Failed to load smart engines. Please wait a moment and try again.",
			},
			{ status: 400 },
		);

	const formData = await request.formData();

	const file = formData.get("settle");
	const udf1 = formData.get("udf1") as string;

	if (!file || !(file instanceof Blob)) {
		return json({ success: false, message: "The file provided is unreadable." }, { status: 400 });
	}

	try {
		const fileBuffer = Buffer.from(await file.arrayBuffer());

		const text = await readSettle(fileBuffer);

		// console.log({ udf1 });
		// console.log(`\n"${text}"\n`);

		if (!text)
			return json({
				success: false,
				message: "Failed to read document, please contact the developer.",
				data: undefined,
			});

		const { data, date, net_val, total_buy, total_buy_clients, total_sell, total_sell_clients } =
			wasm.settle_v1(text, udf1);

		interface RustRow {
			csd_ref: string;
			broker_ref: string;
			luse_id: number;
			symbol: string;
			price: number;
			qty: number;
			value: number;
			counter_firm: string;
			side: "buy" | "sell";
			date: number;
		}

		if (!data.length)
			return json({
				success: false,
				message: `No trades to settle today.`,
				data: undefined,
			});

		const luseIds: number[] = [];

		data.forEach((row: RustRow) => {
			if (!luseIds.includes(row.luse_id)) luseIds.push(row.luse_id);
		});

		const names = await dbs.sbz.getClientNameById(luseIds);

		if (!names.length)
			return json({
				success: false,
				message: "Failed to fetch client names, please contact the developer.",
				data: undefined,
			});

		const trades: SettledTradeInsert[] = [];

		data.forEach((row: RustRow) => {
			const name = names.filter((item) => item.luse_id === row.luse_id);

			const { broker_ref, counter_firm, csd_ref, date, luse_id, price, qty, side, symbol, value } =
				row;

			trades.push({
				broker_ref: broker_ref,
				counter_firm: counter_firm,
				csd_ref: csd_ref,
				date,
				luse_id: luse_id,
				names: name.length ? name[0].names : "Unkown",
				price,
				qty,
				side,
				symbol,
				value,
				currency: symbol.toLowerCase().includes("usd") ? "usd" : udf1,
				broker_comission: name.length ? name[0].broker_comission : 0.01,
			});
		});

		// console.log({ trades });

		let totalBuy: number = 0;
		let totalBuyUsd: number = 0;
		let totalSell: number = 0;
		let totalSellUsd: number = 0;

		trades.forEach((t) => {
			if (t.currency === "zmw") {
				t.side === "buy" ? (totalBuy += t.value) : (totalSell += t.value);
			} else {
				t.side === "buy" ? (totalBuyUsd += t.value) : (totalSellUsd += t.value);
			}
		});

		return json({
			success: true,
			message: "",
			data: {
				trades,
				date,
				netVal: totalSell - totalBuy,
				netValUsd: totalSellUsd - totalBuyUsd,
				totalBuyClients: total_buy_clients,
				totalSellClients: total_sell_clients,
				totalBuy,
				totalBuyUsd,
				totalSell,
				totalSellUsd,
			},
		});
	} catch (ex: any) {
		console.log("\n\nserver ex", ex, "\n\n");
		return json({ success: false, message: ex.toString() }, { status: 500 });
	}
};

export const POST = async (event) => {
	const sender = await kratos.admin(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	const { obj, udf1 }: { obj: SettledTradeInsert[]; udf1: string } = await request.json();

	const settleRes = await dbs.sbz.settleTrades(obj);

	return json({ success: settleRes.success, message: settleRes.message });
};
