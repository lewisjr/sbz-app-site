import { json } from "@sveltejs/kit";
import kratos from "$lib/server/kratos";
import { PdfReader } from "pdfreader";
import dbs from "$lib/server/db";

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

	if (!file || !(file instanceof Blob)) {
		return json({ success: false, message: "The file provided is unreadable." }, { status: 400 });
	}

	try {
		const fileBuffer = Buffer.from(await file.arrayBuffer());

		const text = await readSettle(fileBuffer);

		return json({ success: true, message: "", data: text });
	} catch (ex: any) {
		console.log(ex);
		return json({ success: false, message: ex.toString() }, { status: 500 });
	}
};
