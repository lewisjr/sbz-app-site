import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import { PdfReader } from "pdfreader";
import dbs from "$lib/server/db";
import { settleV1 } from "$lib/server/rust";

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

	const formData = await request.formData();

	const file = formData.get("settle");
	const udf1 = formData.get("udf1") as string;

	if (!file || !(file instanceof Blob)) {
		return json({ success: false, message: "The file provided is unreadable." }, { status: 400 });
	}

	try {
		const fileBuffer = Buffer.from(await file.arrayBuffer());

		const text = await readSettle(fileBuffer);

		if (!text)
			return json({
				success: false,
				message: "Failed to read document, please contact the developer.",
				data: undefined,
			});

		const { data, date, netVal, totalBuy, totalBuyClients, totalSell, totalSellClients } =
			settleV1(text);

		if (!data.length)
			return json({
				success: false,
				message: `No ${udf1.toUpperCase()} trades to settle today.`,
				data: undefined,
			});

		const luseIds: number[] = [];

		data.forEach((row) => {
			if (!luseIds.includes(row.luseId)) luseIds.push(row.luseId);
		});

		const names = await dbs.sbz.getClientNameById(luseIds);

		const trades: SettledTradeInsert[] = [];

		data.forEach((row) => {
			const name = names.filter((item) => item.luse_id === row.luseId);

			const { brokerRef, counterFirm, csdRef, date, luseId, price, qty, side, symbol, value } = row;

			trades.push({
				broker_ref: brokerRef,
				counter_firm: counterFirm,
				csd_ref: csdRef,
				date,
				luse_id: luseId,
				names: name.length ? name[0].names : "Unkown",
				price,
				qty,
				side,
				symbol,
				value,
				currency: udf1,
			});
		});

		return json({
			success: true,
			message: "",
			data: { trades, date, netVal, totalBuy, totalBuyClients, totalSell, totalSellClients },
		});
	} catch (ex: any) {
		console.log(ex);
		return json({ success: false, message: ex.toString() }, { status: 500 });
	}
};
