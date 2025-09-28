import notif from "../email";
import { nfdb, sbzdb } from "./db";
import { genDbTimestamp, genId } from "$lib/utils";
import { toTitleCase } from "@cerebrusinc/fstring";

import Tokenise from "../tokenise";

import type {
	SBZdb,
	TicketRowLean,
	GenericResponse,
	GenericResponseWData,
	CloseTicketReturnObj,
} from "$lib/types";
import type { StorageError } from "@supabase/storage-js";

import { DEV } from "$env/static/private";

const IS_DEV = DEV === "y";

const tokenise = new Tokenise();

// * SBZ DB functions
interface LogObj {
	title: string;
	message: string;
}

interface OTPObj {
	user: string;
	otp: number;
}

export interface OTPBulkObj {
	updated_at: string;
	id: string;
	otp: number;
}

interface TicketCandidateObj {
	name: string;
	agentId: string;
	email: string;
	phone: string;
	/**The specific id of the current user's ticket obj in the `system-vars` table */
	_id: number;
}
interface TicketCandidateObjExt extends TicketCandidateObj {
	volume: number;
	month: number;
}

type OdynInsert = SBZdb["public"]["Tables"]["odyn-tickets"]["Insert"];

export interface FileData {
	id: string;
	type: "poi" | "poa";
	file: File;
}

type AdminRow = SBZdb["public"]["Tables"]["admins"]["Row"];
type ClientRow = SBZdb["public"]["Tables"]["clients"]["Row"];

interface AgentIDs {
	username: string;
}

type AuditRow = SBZdb["public"]["Tables"]["odyn-history"]["Row"];

interface ReassignByEmailObj {
	old: string;
	new: string;
	sender: string;
	ticketId: string;
	clientEmail: string;
	clientName: string;
	queryType: string;
	message: string;
}

interface AddHistoryObj {
	ticketId: string;
	creator: string;
	message: string;
}

type LogRow = SBZdb["public"]["Tables"]["logs"]["Row"];
type OTPRow = SBZdb["public"]["Tables"]["otps"]["Row"];
type StaffRow = SBZdb["public"]["Tables"]["admins"]["Row"];
export type StaffInsertRow = SBZdb["public"]["Tables"]["admins"]["Insert"];
type ChatInsert = SBZdb["public"]["Tables"]["odyn-chats"]["Insert"];

export interface NotifConfigObj {
	email: string;
	msgId: string;
	subject: string;
	name: string;
}

export interface CloseTicketObj {
	clientEmail: string;
	ticketId: string;
	reason: string;
	assigneeVars: string;
	clientVars: string;
	names: string;
}

interface CloseTicketObjInternal extends CloseTicketObj {
	adminEmail: string;
	admin: string;
}

type ChatRow = SBZdb["public"]["Tables"]["odyn-chats"]["Row"];

interface SBZutils {
	log: (obj: LogObj) => Promise<void>;
	setOtp: (obj: OTPObj) => Promise<GenericResponse>;
	setBulkOtp: (obj: OTPBulkObj[]) => Promise<GenericResponse>;
	checkOtp: (obj: OTPObj) => Promise<GenericResponse>;
	getTicketCandidate: () => Promise<GenericResponseWData<TicketCandidateObjExt>>;
	updateTicketCandidate: (obj: TicketCandidateObjExt) => Promise<void>;
	createTicket: (
		obj: OdynInsert,
		agent: TicketCandidateObjExt,
	) => Promise<GenericResponseWData<string>>;
	createCompliment: (obj: OdynInsert) => Promise<GenericResponse>;
	createAIticket: (obj: OdynInsert) => Promise<GenericResponseWData<string>>;
	getAllTickets: () => Promise<TicketRowLean[]>;
	closeTicket: (obj: CloseTicketObjInternal) => Promise<GenericResponseWData<CloseTicketReturnObj>>;
	getOneTicket: (ticketId: string) => Promise<TicketRowLean>;
	reassignWebTicket: (obj: ReassignByEmailObj) => Promise<GenericResponse>;
	uploadKyc: (files: FileData[]) => Promise<void>;

	isAdminCorrect: (username: string) => Promise<boolean>;
	getAdmin: (username: string) => Promise<AdminRow[]>;
	// getAdmins: () => Promise<AdminRow[]>;
	isClientCorrect: (luseId: number) => Promise<boolean>;
	getClient: (luseId: number) => Promise<ClientRow[]>;

	getAgents: () => Promise<AgentIDs[]>;

	auditTicket: (ticketId: string) => Promise<GenericResponseWData<AuditRow[]>>;
	appendHistory: (obj: AddHistoryObj) => Promise<boolean>;

	// system ops
	getAllLogs: () => Promise<LogRow[]>;
	getAllOtps: () => Promise<OTPRow[]>;
	getAllStaff: () => Promise<StaffRow[]>;
	addStaffMember: (obj: StaffInsertRow) => Promise<GenericResponseWData<StaffRow | undefined>>;

	// chat stuff
	sendChat: (obj: ChatInsert, notifCongif?: NotifConfigObj) => Promise<boolean>;
	/**Move chat from AI to human */
	humanifyChatWeb: (ticket: TicketRowLean) => Promise<GenericResponse>;
	getAllChatMessages: (ticketId: string) => Promise<ChatRow[]>;
}

const sbz = (): SBZutils => {
	const _log = async (obj: LogObj): Promise<void> => {
		try {
			const {} = await sbzdb.from("logs").insert({ title: obj.title, value: obj.message });
			console.log(`\n${obj.title} ==> ${obj.message}`);
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			console.error("\nomnibot._log ex\n", error);
		}
	};

	const _setOtp = async (obj: OTPObj): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("otps")
				.upsert({ otp: obj.otp, id: obj.user, updated_at: genDbTimestamp() });

			if (error) {
				await _log({ message: error.message, title: "Set OTP Error" });
				return {
					message: "Failed to generate your OTP, please wait a few minutes and try again.",
					success: false,
				};
			}

			return { message: "Please check your email for the OTP.", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Set OTP Exception" });
			return { success: false, message: "Server error, please wait 10 minutes and try again." };
		}
	};

	const _setBulkOtp = async (obj: OTPBulkObj[]): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb.from("otps").upsert(obj);

			if (error) {
				await _log({ message: error.message, title: "Set OTP Error" });
				return {
					message: "Failed to generate your OTP, please wait a few minutes and try again.",
					success: false,
				};
			}

			return { message: "Please check your email for the OTP.", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Set OTP Exception" });
			return { success: false, message: "Server error, please wait 10 minutes and try again." };
		}
	};

	const _checkOtp = async (obj: OTPObj): Promise<GenericResponse> => {
		try {
			const { data, error } = await sbzdb.from("otps").select("otp").filter("id", "eq", obj.user);

			if (error) {
				await _log({ message: error.message, title: "Check OTP Error" });
				return {
					message: "Failed to get your OTP, please wait a few minutes and try again.",
					success: false,
				};
			}

			if (data[0].otp !== obj.otp) return { message: "Incorrect value entered!", success: false };
			else return { message: "Redirecting...", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Check OTP Exception" });
			return { success: false, message: "Critical error, please try again in 5 minutes." };
		}
	};

	const _getTicketCandidate = async (): Promise<GenericResponseWData<TicketCandidateObjExt>> => {
		/**First day of the current month */
		const fdm = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

		/**First day of the next month */
		const fdnm = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

		let data: TicketCandidateObjExt = {
			email: "",
			name: "",
			phone: "",
			agentId: "",
			_id: -1,
			month: -1,
			volume: -1,
		};

		try {
			/**Order in terms of descending value */
			const ticketedAdminsReq = sbzdb
				.from("system-vars")
				.select()
				.ilike("key", "%tickets%")
				.gte("created_at", fdm)
				.lt("created_at", fdnm)
				.order("value", { ascending: false });

			/**Order in terms of ascending name */
			const adminsReq = sbzdb
				.from("admins")
				.select()
				.filter("ticketable", "eq", true)
				.order("full_names", { ascending: true });

			const [ticketedAdminsRes, adminsRes] = await Promise.all([ticketedAdminsReq, adminsReq]);

			if (ticketedAdminsRes.error) {
				await _log({
					message: ticketedAdminsRes.error.message,
					title: "Get Ticketed Admins Error",
				});
				return { success: false, data, message: ticketedAdminsRes.error.message };
			}

			if (adminsRes.error) {
				await _log({ message: adminsRes.error.message, title: "Get Ticketable Admins Error" });
				return { data, message: adminsRes.error.message, success: false };
			}

			const agents: TicketCandidateObjExt[] = ticketedAdminsRes.data.map((r) => {
				const _d = new Date(r.created_at);
				const _m = _d.getMonth();
				return {
					_id: r.id,
					email: "",
					name: "",
					phone: "",
					agentId: r.key.replace(".tickets", ""),
					volume: Number(r.value),
					month: _m,
				};
			});

			const toConsinderArr: TicketCandidateObjExt[] = [];

			adminsRes.data.forEach((agent) => {
				const alreadyExisting = agents.find((item) => item.agentId === agent.username);

				const _m = new Date().getMonth();

				if (alreadyExisting)
					toConsinderArr.push({
						_id: alreadyExisting._id,
						email: agent.email,
						name: agent.full_names,
						phone: agent.phone,
						agentId: agent.username,
						volume: alreadyExisting.volume,
						month: alreadyExisting.month,
					});
				else
					toConsinderArr.push({
						_id: -1,
						email: agent.email,
						name: agent.full_names,
						phone: agent.phone,
						agentId: agent.username,
						volume: 0,
						month: _m,
					});
			});

			toConsinderArr.sort((a, b) => a.volume - b.volume);

			return { success: true, data: toConsinderArr[0], message: "" };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Ticket Candidate Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
				data,
			};
		}
	};

	const _appendHistory = async (obj: AddHistoryObj): Promise<boolean> => {
		try {
			const { error } = await sbzdb.from("odyn-history").insert({
				ticket_no: obj.ticketId,
				creator: obj.creator,
				message: obj.message,
			});

			if (error) {
				await _log({ message: error.message, title: "Append History Error" });
				return false;
			}

			return true;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Append History Exception" });
			return false;
		}
	};

	const _createTicket = async (
		obj: OdynInsert,
		agent: TicketCandidateObjExt,
	): Promise<GenericResponseWData<string>> => {
		try {
			const ticket = genId();

			obj.id = ticket;

			const { error } = await sbzdb.from("odyn-tickets").insert(obj);

			if (error) {
				await _log({ message: error.message, title: "Create Ticket Error" });
				return { data: "", message: error.message, success: false };
			}

			const subject = `New Ticket | ${obj.query_type} ${ticket}`;

			const msgId = await notif.email.sendNested(
				{
					subject,
					title: `Ticket ${ticket}`,
					body: `A new <b>${obj.query_type}</b> ticket has been opened and assigned to <b>${toTitleCase(obj.assigned)}</b>. Please click below to review.`,
					link: `https://app.sbz.com.zm/admin/tickets?q=${ticket}`,
					linkText: "View Ticket",
					extra: obj.query.length ? `Original query:<br />${obj.query}` : "",
					cc: IS_DEV ? "sbzlewis@gmail.com" : "trading@sbz.com.zm",
				},
				IS_DEV ? "privatodato@gmail.com" : agent.email,
			);

			await sbzdb
				.from("odyn-tickets")
				.update({ assignee_email_vars: `${msgId},,${subject}` })
				.eq("id", ticket);

			return { message: `Successfully created ticket #${ticket}`, success: true, data: ticket };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Create Ticket Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
				data: "",
			};
		}
	};

	const _closeTicket = async (
		obj: CloseTicketObjInternal,
	): Promise<GenericResponseWData<CloseTicketReturnObj>> => {
		const emptyObj: CloseTicketReturnObj = {
			close_date: "",
			close_reason: "",
			closed_by: "",
			is_closed: false,
		};

		try {
			const { admin, adminEmail, reason, ticketId, clientEmail, assigneeVars, clientVars, names } =
				obj;

			const closeObj: CloseTicketReturnObj = {
				close_date: genDbTimestamp(),
				close_reason: reason,
				closed_by: admin,
				is_closed: true,
			};

			const { error } = await sbzdb.from("odyn-tickets").update(closeObj).eq("id", ticketId);

			if (error) {
				await _log({ message: error.message, title: "Close Ticket Error" });
				return { data: emptyObj, message: error.message, success: false };
			}

			const [adminMsgId, adminSubject] = assigneeVars ? assigneeVars.split(",,") : ",,";
			const [clientMsgId, clientSubject] = clientVars ? clientVars.split(",,") : ",,";

			const adminMailReq = notif.email.sendNestedNoButton(
				{
					subject: adminSubject.length ? adminSubject : `Ticket #${ticketId} Closed`,
					title: `Ticket Closed!`,
					body: `Hi <b>${toTitleCase(admin)}</b>,<br /><br />You just closed this ticket with the following reason:`,
					extra: `<i>${reason}</i>`,
					cc: IS_DEV ? "sbzlewis@gmail.com" : "trading@sbz.com.zm",
				},
				IS_DEV ? "privatodato@gmail.com" : adminEmail,
				adminMsgId.length ? adminMsgId : undefined,
			);

			const clientMailReq = notif.email.sendNestedNoButton(
				{
					subject: clientSubject.length ? clientSubject : `Ticket #${ticketId} Closed`,
					title: `Ticket Closed!`,
					body: `Hi <b>${names.split(" ")[0]}</b>,<br /><br /><b>${toTitleCase(admin)}</b> just closed this ticket with the following reason:`,
					extra: `<i>${reason}</i>`,
				},
				IS_DEV ? "privatodato@gmail.com" : clientEmail,
				clientMsgId.length ? clientMsgId : undefined,
			);

			await Promise.all([adminMailReq, clientMailReq]);

			return { message: `Successfully closed ticket #${ticketId}!`, success: true, data: closeObj };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Close Ticket Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
				data: emptyObj,
			};
		}
	};

	const _createAITicket = async (obj: OdynInsert): Promise<GenericResponseWData<string>> => {
		try {
			const ticket = genId();

			obj["id"] = ticket;
			obj["assigned"] = "odyn";

			const { error } = await sbzdb.from("odyn-tickets").insert(obj);

			if (error) {
				await _log({ message: error.message, title: "Create AI Ticket Error" });
				return { data: "", message: error.message, success: false };
			}

			const subject = `${obj.query_type} #${ticket} | Stockbrokers Zambia`;
			const link = `/track/${ticket}`;

			const msgId = await notif.email.sendNested(
				{
					subject: `${obj.query_type} #${ticket} | Stockbrokers Zambia`,
					title: "Ticket Opened!",
					body: `Hi ${obj.names.split(" ")[0]}<br /><br />Your ticket has been opened! You can click the button below to access the chat room.`,
					extra: `<b>Your query:</b><br /><i>${obj.query}</i>`,
					link: `https://app.sbz.com.zm${link}`,
					linkText: "Open Chat",
				},
				obj.email,
			);

			if (msgId) {
				await sbzdb
					.from("odyn-tickets")
					.update({ email_vars: `${msgId},,${subject}` })
					.eq("id", ticket);
			}

			return { message: `Opening chat room...`, success: true, data: link };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Create Ticket Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
				data: "",
			};
		}
	};

	const _createCompliment = async (obj: OdynInsert): Promise<GenericResponse> => {
		try {
			const ticket = genId();
			const date = genDbTimestamp();

			obj["id"] = ticket;
			obj["assigned"] = "odyn";
			obj["closed_by"] = "odyn";
			obj["close_date"] = date;
			obj["is_closed"] = true;
			obj["created_at"] = date;

			const { error } = await sbzdb.from("odyn-tickets").insert(obj);

			if (error) {
				await _log({ message: error.message, title: "Create Compliment Error" });
				return { message: error.message, success: false };
			}

			notif.email.sendLink(
				{
					subject: "Compliment Received! | Stockbrokers Zambia",
					title: "Thank you!",
					body: `Hi ${obj.names.split(" ")[0]},<br /><br />Your compliment has been well received! What to do now? Click the button below to sign in to your account and take control of your investments!`,
					extra: `Don't have an account? <a href="https://app.sbz.com.zm/sign-up">Open an account</a>.`,
					link: `https://app.sbz.com.zm/sign-in`,
					linkText: "Sign In",
				},
				obj.email,
			);

			return {
				message: `Compliment submitted!`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Create Compliment Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
			};
		}
	};

	const _reassignWebTicket = async (obj: ReassignByEmailObj): Promise<GenericResponse> => {
		const { ticketId, new: neew, old, sender, clientEmail, clientName, queryType, message } = obj;

		/**First day of the current month */
		const fdm = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

		/**First day of the next month */
		const fdnm = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

		try {
			const reassignReq = sbzdb.from("odyn-tickets").update({ assigned: neew }).eq("id", ticketId);
			const updateHistoryReq = sbzdb.from("odyn-history").insert({
				creator: sender,
				message: `${toTitleCase(sender)} reassigned this ticket to ${toTitleCase(neew)} from ${toTitleCase(old)}.`,
				ticket_no: ticketId,
			});
			const ticketAdminsReq = sbzdb
				.from("system-vars")
				.select()
				.in("key", [old, neew])
				.gte("created_at", fdm)
				.lt("created_at", fdnm)
				.order("value", { ascending: false });
			/**Order in terms of ascending name */
			const adminsReq = sbzdb
				.from("admins")
				.select("email,username")
				.filter("username", "eq", neew);

			const [reassignRes, updateHistoryRes, ticketAdminsRes, adminsRes] = await Promise.all([
				reassignReq,
				updateHistoryReq,
				ticketAdminsReq,
				adminsReq,
			]);

			if (reassignRes.error) {
				await _log({ message: reassignRes.error.message, title: "Reassign Ticket Error - 1" });
				return { message: reassignRes.error.message, success: false };
			}

			if (updateHistoryRes.error) {
				await _log({ message: updateHistoryRes.error.message, title: "Reassign Ticket Error - 2" });
			}

			if (ticketAdminsRes.error) {
				await _log({ message: ticketAdminsRes.error.message, title: "Reassign Ticket Error - 3" });
				return {
					message: "Failed to proceed past third operation. Please refresh your browser.",
					success: false,
				};
			}

			if (adminsRes.error) {
				await _log({ message: adminsRes.error.message, title: "Reassign Ticket Error - 4" });
				return {
					message: "Failed to proceed past fourth operation. Please refresh your browser.",
					success: false,
				};
			}

			const agents: TicketCandidateObjExt[] = ticketAdminsRes.data.map((r) => {
				const _d = new Date(r.created_at);
				const _m = _d.getMonth();
				return {
					_id: r.id,
					email: "",
					name: "",
					phone: "",
					agentId: r.key.replace(".tickets", ""),
					volume: Number(r.value),
					month: _m,
				};
			});

			const updatedAgentObects: TicketCandidateObjExt[] = [];

			let newAgentEmail: string = "";

			adminsRes.data.forEach((agent) => {
				const alreadyExisting = agents.find((item) => item.agentId === agent.username);

				const _m = new Date().getMonth();

				if (agent.username === neew) newAgentEmail = agent.email;

				if (alreadyExisting)
					updatedAgentObects.push({
						_id: alreadyExisting._id,
						email: agent.email,
						name: "",
						phone: "",
						agentId: agent.username,
						volume: alreadyExisting.volume,
						month: alreadyExisting.month,
					});
				else
					updatedAgentObects.push({
						_id: -1,
						email: agent.email,
						name: "",
						phone: "",
						agentId: agent.username,
						volume: 0,
						month: _m,
					});
			});

			const sendStaffMail = notif.email.sendLink(
				{
					subject: `Ticket Reassignment | ${ticketId}`,
					title: `Query Type: <i>${queryType}</i>`,
					body: `Hi ${toTitleCase(neew)},<br /><br /><b>${toTitleCase(sender)}</b> has assigned ticket number <b>${ticketId}</b> to you from <b>${toTitleCase(old)}</b>.`,
					link: `https://app.sbz.com.zm/admin/tickets?q=${ticketId}`,
					linkText: "View Ticket",
					extra: `Reassignment Reason:<br />${message}`,
					cc: IS_DEV ? "sbzlewis@gmail.com" : "trading@sbz.com.zm",
				},
				IS_DEV ? "privatodato@gmail.com" : newAgentEmail,
			);

			const sendClientMail = notif.email.sendLink(
				{
					subject: `Ticket Reassignment | ${ticketId}`,
					title: `Some Good News!`,
					body: `Hi ${clientName},<br /><br /><b>${toTitleCase(neew)}</b> has been assigned to look into your open ticket numbered <b>${ticketId}</b>. We usually respond within 24 hours.`,
					link: `https://app.sbz.com.zm/track/${ticketId}`,
					linkText: "View Ticket",
					extra: "",
				},
				clientEmail,
			);

			const [] = await Promise.all([
				...updatedAgentObects.map((agent) =>
					_updateTicketCandidate(agent, agent.agentId === old ? true : undefined),
				),
				sendStaffMail,
				sendClientMail,
			]);

			return {
				message: `${toTitleCase(neew)} is now assigned to ticket ${ticketId}!`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Reassign Ticket Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
			};
		}
	};

	const _getAllTickets = async (): Promise<TicketRowLean[]> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-tickets")
				.select(
					"assigned,close_date,created_at,email,id,id_num,is_closed,luse_id,names,phone,platform,query,query_type,referral_source,closed_by,email_vars,uid,assignee_email_vars,close_reason",
				)
				.order("created_at", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get Tickets Error" });
				return [];
			}

			return data;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Tickets Exception" });
			return [];
		}
	};

	const _getOneTicket = async (ticketId: string): Promise<TicketRowLean> => {
		const emptyObj = {
			assigned: "",
			close_date: "",
			closed_by: "",
			created_at: "",
			email: "",
			email_vars: "",
			assignee_email_vars: "",
			id: "",
			id_num: "",
			is_closed: false,
			luse_id: -1,
			names: "",
			phone: "",
			platform: "",
			query: "",
			query_type: "",
			referral_source: "",
			uid: "",
			close_reason: "",
		};

		try {
			const { data, error } = await sbzdb
				.from("odyn-tickets")
				.select(
					"assigned,close_date,created_at,email,id,id_num,is_closed,luse_id,names,phone,platform,query,query_type,referral_source,closed_by,email_vars,uid,assignee_email_vars,close_reason",
				)
				.filter("id", "eq", ticketId);

			if (error) {
				await _log({ message: error.message, title: "Get Ticket Error" });
				return emptyObj;
			}

			if (data.length) return data[0];

			return emptyObj;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Ticket Exception" });
			return emptyObj;
		}
	};

	const _updateTicketCandidate = async (
		obj: TicketCandidateObjExt,
		decrease?: boolean,
	): Promise<void> => {
		try {
			const currentMonth = new Date().getMonth();

			const k = decrease ? -1 : 1;

			let ex: any = null;

			if (currentMonth === obj.month && obj._id > -1) {
				const { error } = await sbzdb
					.from("system-vars")
					.update({ value: (obj.volume + k).toString() })
					.eq("id", obj._id);
				ex = error;
			} else {
				const { error } = await sbzdb
					.from("system-vars")
					.insert({ value: (obj.volume + k).toString(), key: `${obj.agentId}.tickets` });
				ex = error;
				return;
			}

			if (ex) {
				await _log({ message: ex.message, title: "Update Agent Error" });
				return;
			}

			return;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Update Agent Exception" });
			return;
		}
	};

	const _uploadKyc = async (files: FileData[]): Promise<void> => {
		const promises: Promise<
			| {
					data: {
						id: string;
						path: string;
						fullPath: string;
					};
					error: null;
			  }
			| {
					data: null;
					error: StorageError;
			  }
		>[] = [];

		const ids: string[] = [];

		const _getFileExtension = (file: File): string | null => {
			// Prefer file.name
			const nameExt = file.name.includes(".") ? file.name.split(".").pop() : null;
			if (nameExt) return nameExt.toLowerCase();

			// Fallback to MIME type
			const ext2 = file.type.split("/").pop() as string;
			return file.type ? ext2 : null;
		};

		try {
			files.forEach((f) => {
				const timestamp = Date.now();
				const ext = _getFileExtension(f.file);

				const _f = sbzdb.storage
					.from("kyc")
					.upload(`${f.id}/${f.type}-${timestamp}.${ext ? ext : ".pdf"}`, f.file, {
						// 1 year in seconds
						cacheControl: "31536000",
						upsert: false,
					});

				promises.push(_f);
				ids.push(f.id);
			});

			const res = await Promise.all(promises);

			const anyFails = res.filter((item) => item.error);

			if (anyFails.length) {
				_log({
					message: `Failed to upload one or more KYC for ${ids.join(",")}.`,
					title: "Upload KYC Error",
				});
			}

			return;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Upload KYC Exception" });
			return;
		}
	};

	const _isAdminCorrect = async (username: string): Promise<boolean> => {
		try {
			const { data, error } = await sbzdb
				.from("admins")
				.select("username")
				.filter("username", "eq", username)
				.filter("approved", "eq", true);

			if (error) {
				_log({
					message: error.message,
					title: "Check Admin Error",
				});
				return false;
			}

			if (data.length) return true;

			return false;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Check Admin Exception" });
			return false;
		}
	};

	const _getAdmin = async (username: string): Promise<AdminRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("admins")
				.select()
				.filter("username", "eq", username);

			if (error) {
				_log({
					message: error.message,
					title: "Get Admin Error",
				});
				return [];
			}

			if (data && data.length) return data;

			return [];
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Admin Exception" });
			return [];
		}
	};

	const _getAgents = async (): Promise<AgentIDs[]> => {
		try {
			const { data, error } = await sbzdb
				.from("admins")
				.select("username")
				.filter("ticketable", "eq", true)
				.order("username", { ascending: true });

			if (error) {
				_log({
					message: error.message,
					title: "Get Agents Error",
				});
				return [];
			}

			if (data && data.length) return data;

			return [];
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Agents Exception" });
			return [];
		}
	};

	const _isClientCorrect = async (luseId: number): Promise<boolean> => {
		try {
			const { data, error } = await sbzdb
				.from("clients")
				.select("luseId")
				.filter("luseId", "eq", luseId)
				.filter("is_approved", "eq", true);

			if (error) {
				_log({
					message: error.message,
					title: "Check Client Error",
				});
				return false;
			}

			if (data.length) return true;

			return false;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Check Client Exception" });
			return false;
		}
	};

	const _getClient = async (luseId: number): Promise<ClientRow[]> => {
		try {
			const { data, error } = await sbzdb.from("clients").select().filter("luseId", "eq", luseId);

			if (error) {
				_log({
					message: error.message,
					title: "Get Client Error",
				});
				return [];
			}

			if (data && data.length) return data;

			return [];
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Client Exception" });
			return [];
		}
	};

	const _auditTicket = async (ticketId: string): Promise<GenericResponseWData<AuditRow[]>> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-history")
				.select()
				.filter("ticket_no", "eq", ticketId)
				.order("created_at", { ascending: true });

			if (error) {
				_log({
					message: error.message,
					title: `Get History Error - ${ticketId}`,
				});
				return {
					data: [],
					message: "Failed to fetch this ticket's history. Please try again in a few minutes.",
					success: false,
				};
			}

			if (data && data.length) return { data, message: "", success: true };

			return { data: [], message: "", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: `Get History Exception - ${ticketId}` });
			return { data: [], message: error, success: false };
		}
	};

	const _getAllLogs = async (): Promise<LogRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("logs")
				.select()
				.order("created_at", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get Logs Error" });
				return [];
			}

			return data;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Logs Exception" });
			return [];
		}
	};

	const _getAllOtps = async (): Promise<OTPRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("otps")
				.select()
				.order("updated_at", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get OTPs Error" });
				return [];
			}

			return data;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get OTPs Exception" });
			return [];
		}
	};

	const _getAllStaff = async (): Promise<StaffRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("admins")
				.select()
				.order("username", { ascending: true });

			if (error) {
				await _log({ message: error.message, title: "Get Staff Error" });
				return [];
			}

			return data;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Staff Exception" });
			return [];
		}
	};

	const _addStaffMember = async (
		obj: StaffInsertRow,
	): Promise<GenericResponseWData<StaffRow | undefined>> => {
		try {
			const { error } = await sbzdb.from("admins").insert(obj);

			if (error) {
				_log({ message: error.message, title: "Create Staff Error" });
				return { data: undefined, message: error.message, success: false };
			}

			const mailReq = notif.email.sendLink(
				{
					body: `Hi ${obj.full_names.split(" ")[0]},<br /><br />You now have access to the SBZ Digital system with username <b>${obj.username}</b>! Click the button below to sign in.`,
					extra: "When entering your username, make sure to put a hashtag <b>#</b> first.",
					link: "https://app.sbz.com.zm/sign-in",
					linkText: "Sign In",
					subject: "Account Created | SBZ Digital",
					title: "Access Granted",
				},
				obj.email,
			);

			const logReq = _log({
				title: "Account Created",
				message: `${toTitleCase(obj.created_by)} created a staff account for ${obj.full_names}.`,
			});

			await Promise.all([mailReq, logReq]);

			const {
				created_by,
				department,
				email,
				full_names,
				permissions,
				phone,
				username,
				ticketable,
			} = obj;

			const nObj: StaffRow = {
				approved: true,
				created_at: genDbTimestamp(),
				ticketable: ticketable ? ticketable : false,
				created_by,
				department,
				email,
				full_names,
				permissions,
				phone,
				username,
			};

			return { data: nObj, message: `${obj.full_names} now has system access!`, success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Create Staff Exception" });
			return { data: undefined, message: error, success: false };
		}
	};

	// chat stuff
	const _sendChat = async (obj: ChatInsert, notifCongif?: NotifConfigObj): Promise<boolean> => {
		const oldBody = obj.body;
		obj.body = tokenise.encode(oldBody);

		try {
			const { error } = await sbzdb.from("odyn-chats").insert(obj);

			if (error) {
				_log({ message: error.message, title: "Send Chat Error" });
				return false;
			}

			if (notifCongif) {
				await notif.email.sendNested(
					{
						subject: notifCongif.subject,
						title: "New Response!",
						body: `Hi ${notifCongif.name}<br /><br /><b>${toTitleCase(obj.sender.split(" ")[0])}</b> has just responded to your message with:<br /><i>${oldBody}</i>`,
						extra: `Click the button above to respond!`,
						link: `https://app.sbz.com.zm/track/${obj.ticket_no}`,
						linkText: "Open Chat",
					},
					notifCongif.email,
					notifCongif.msgId,
				);
			}

			return true;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Send Chat Exception" });

			return false;
		}
	};

	/**Move chat from AI to human */
	const _humanifyChatWeb = async (ticket: TicketRowLean): Promise<GenericResponse> => {
		try {
			const agent = await _getTicketCandidate();

			if (!agent.success) {
				_log({ message: agent.message, title: "Assign Ticket Error - 1" });
				return {
					message: "Failed to assign ticket to an agent. Please try again in a few minutes.",
					success: false,
				};
			}

			const clientEmail = ticket.uid ?? ticket.email;

			const reassign = await _reassignWebTicket({
				clientEmail,
				clientName: ticket.names.split(" ")[0],
				message: "The client wants to speak to a human.",
				new: agent.data.agentId,
				old: "odyn",
				queryType: ticket.query_type,
				sender: "odyn",
				ticketId: ticket.id,
			});

			if (!reassign.success) {
				_log({ message: reassign.message, title: "Assign Ticket Error - 2" });
				return {
					message: "Failed to assign ticket to an agent. Please try again in a few minutes.",
					success: false,
				};
			}

			const historyReq = _appendHistory({
				creator: "odyn",
				message: `Odyn assigned this ticket to ${toTitleCase(agent.data.agentId)}.`,
				ticketId: ticket.id,
			});

			if (!historyReq) {
				_log({ message: "Failed to append history.", title: "Assign Ticket Error - 3" });
			}

			return {
				message: `This ticket has been assigned to ${toTitleCase(agent.data.agentId)}! Expect a response within 24 hours.`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Assign Ticket Exception" });
			return { message: "Server error, try again in a few minutes.", success: false };
		}
	};

	const _getAllChatMessages = async (ticketId: string): Promise<ChatRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-chats")
				.select()
				.filter("ticket_no", "eq", ticketId)
				.order("created_at", { ascending: true });

			if (error) {
				await _log({ message: error.message, title: "Get Messages Error" });
				return [];
			}

			const decoded: ChatRow[] = [];

			data.forEach((row) => {
				const newRow: ChatRow = JSON.parse(JSON.stringify(row));

				newRow.body = tokenise.decode(newRow.body);

				decoded.push(newRow);
			});

			decoded.sort((a, b) => {
				const aDate = new Date(a.created_at);
				const bDate = new Date(b.created_at);

				return aDate.getTime() - bDate.getTime();
			});

			return decoded;
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Messages Exception" });
			return [];
		}
	};

	return {
		log: _log,
		setOtp: _setOtp,
		setBulkOtp: _setBulkOtp,
		checkOtp: _checkOtp,
		getTicketCandidate: _getTicketCandidate,
		createTicket: _createTicket,
		createAIticket: _createAITicket,
		closeTicket: _closeTicket,
		createCompliment: _createCompliment,
		getAllTickets: _getAllTickets,
		getOneTicket: _getOneTicket,
		updateTicketCandidate: _updateTicketCandidate,
		uploadKyc: _uploadKyc,
		getAdmin: _getAdmin,
		isAdminCorrect: _isAdminCorrect,
		getClient: _getClient,
		isClientCorrect: _isClientCorrect,
		getAgents: _getAgents,
		reassignWebTicket: _reassignWebTicket,
		auditTicket: _auditTicket,
		appendHistory: _appendHistory,
		getAllLogs: _getAllLogs,
		getAllOtps: _getAllOtps,
		getAllStaff: _getAllStaff,
		addStaffMember: _addStaffMember,
		getAllChatMessages: _getAllChatMessages,
		humanifyChatWeb: _humanifyChatWeb,
		sendChat: _sendChat,
	};
};

// ? NeuroFlow DB functions
interface NFutils {}

const nf = (): NFutils => {
	return {};
};

// end

export { sbz, nf };
