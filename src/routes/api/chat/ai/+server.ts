import { json } from "@sveltejs/kit";
import dbs from "$lib/server/db";
import kratos from "$lib/server/kratos.js";

import { SERVER_API_KEY, SERVER_BASE_URL } from "$env/static/private";

import type { GenericResponseWData, SBZdb } from "$lib/types/index";
import { toTitleCase } from "@cerebrusinc/fstring";

export const POST = async (event) => {
	const sender = await kratos.chat(event);
	if (sender instanceof Response) return sender;

	const { request } = event;

	type Chat = SBZdb["public"]["Tables"]["odyn-chats"]["Row"];

	const {
		ticketId,
		clientEmail,
		clientName,
		history,
		queryType,
	}: {
		ticketId: string;
		clientEmail: string;
		clientName: string;
		history: Chat[];
		queryType: string;
	} = await request.json();

	let _history = "";

	history.forEach((chat) => {
		_history += `\n${chat.sender !== "odyn" ? "user" : "model"}: ${chat.body}`;
	});

	const odynReq = await fetch(`${SERVER_BASE_URL}/ai/web`, {
		method: "POST",
		body: JSON.stringify({ history: _history.trim(), queryType }),
		headers: {
			"X-API-KEY": Buffer.from(SERVER_API_KEY, "utf8").toString("base64"),
		},
	});

	const odynRes: GenericResponseWData<string> = await odynReq.json();

	if (!odynRes.success)
		return json(
			{
				success: false,
				message: "Failed to fetch AI response, please refresh your browser",
				data: "",
			},
			{ status: 400 },
		);

	if (odynRes.data === "reassign") {
		const agent = await dbs.sbz.getTicketCandidate();
		const reassign = await dbs.sbz.reassignWebTicket(
			{
				ticketId,
				clientEmail,
				clientName,
				message: history[0].body,
				new: agent.data.agentId,
				old: "odyn",
				queryType,
				sender: "odyn",
			},
			true,
		);

		return json(
			{
				success: reassign.success,
				message: reassign.success
					? `This ticket has been reassigned to broker ${toTitleCase(agent.data.agentId)}.`
					: "Failed to fetch AI response, please refresh your browser.",
				data: reassign.success ? "reload" : "",
			},
			{ status: reassign.success ? 200 : 400 },
		);
	}

	const objs: ChatInsert[] = [];

	if (odynRes.data === "get_portfolio") {
		objs.push({ body: "Get Portfolio W.I.P", type: "text", sender: "odyn", ticket_no: ticketId });
	}

	if (odynRes.data === "get_contract_note") {
		objs.push({ body: "Get CN W.I.P", type: "text", sender: "odyn", ticket_no: ticketId });
	}

	type ChatInsert = SBZdb["public"]["Tables"]["odyn-chats"]["Insert"];

	if (odynRes.data.includes("||command||")) {
		odynRes.data.split("||command||").forEach((msg) => {
			objs.push({
				body: msg,
				type: msg.substring(0, 2) === "//" ? "command" : "text",
				sender: "odyn",
				ticket_no: ticketId,
			});
		});
	} else if (odynRes.data.length) {
		objs.push({ body: odynRes.data, type: "text", sender: "odyn", ticket_no: ticketId });
	}

	const sendAIReq = objs.length ? await dbs.sbz.sendChats(objs) : false;

	if (!sendAIReq)
		return json(
			{
				success: false,
				message: "Failed to fetch AI response, please refresh your browser",
				data: "",
			},
			{ status: 400 },
		);

	return json({ success: true, message: "", data: "" }, { status: 200 });
};
