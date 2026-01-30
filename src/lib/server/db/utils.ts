import notif from "../email";
import { nfdb, sbzdb } from "./db";
import {
	genDbTimestamp,
	genId,
	genDate,
	getOldDate,
	prettyDate,
	fileNamifier,
	sanitizeFname,
	print,
} from "$lib/utils";
import { toTitleCase } from "@cerebrusinc/fstring";
import manifest from "../../../../package.json";

import Tokenise from "../tokenise";

import type {
	SBZdb,
	TicketRowLean,
	GenericResponse,
	GenericResponseWData,
	CloseTicketReturnObj,
	NFdb,
	SettledTradeInsert,
	NewsLean,
	NFHelp,
	GetPortfolioData,
	Types,
} from "$lib/types";
import type { StorageError } from "@supabase/storage-js";

import { DEV, SERVER_BASE_URL } from "$env/static/private";

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

interface OTPObjTwo {
	users: string[];
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
	type: "poi" | "poa" | "selfie" | "aco";
	file: File | Blob;
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

interface AppendEmailVarsObj {
	subject: string;
	msgId: string;
}

type SocialsRow = SBZdb["public"]["Tables"]["odyn-socials"]["Row"];

type SettledTradeRow = SBZdb["public"]["Tables"]["settled_trades"]["Row"];
type TempClientName = SBZdb["public"]["Tables"]["clients"]["Row"];

interface TempClientNameTwo {
	luse_id: number;
	created_at: string;
	names: string;
	broker_comission: number;
}

interface ApiVersion {
	success: boolean;
	version: string;
}

type DeepStatInsert = SBZdb["public"]["Tables"]["deep-stats"]["Insert"];
type DeepStat = SBZdb["public"]["Tables"]["deep-stats"]["Row"];

type ClientInsert = SBZdb["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = SBZdb["public"]["Tables"]["clients"]["Update"];

interface SBZutils {
	log: (obj: LogObj) => Promise<void>;
	getAllLogs: () => Promise<LogRow[]>;

	deepStat: (obj: DeepStatInsert) => Promise<void>;
	getAllDeepStats: () => Promise<DeepStat[]>;

	setOtp: (obj: OTPObj) => Promise<GenericResponse>;
	setBulkOtp: (obj: OTPBulkObj[]) => Promise<GenericResponse>;
	checkOtp: (obj: OTPObj) => Promise<GenericResponse>;
	checkOtpTwo: (obj: OTPObjTwo) => Promise<GenericResponseWData<string>>;

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
	reassignWebTicket: (obj: ReassignByEmailObj, aiMode?: boolean) => Promise<GenericResponse>;
	appendClientEmailVars: (obj: AppendEmailVarsObj) => Promise<boolean>;
	uploadKyc: (files: FileData[]) => Promise<void>;
	uploadFiles: (files: File[], ticketId: string) => Promise<GenericResponse>;

	isAdminCorrect: (username: string) => Promise<boolean>;
	getAdmin: (username: string) => Promise<AdminRow[]>;
	// getAdmins: () => Promise<AdminRow[]>;
	isClientCorrect: (luseId: number) => Promise<boolean>;
	getClient: (luseId: number) => Promise<ClientRow[]>;
	openAccount: (
		obj: ClientInsert,
		autoApprove?: boolean,
		sender?: string,
	) => Promise<GenericResponse>;
	updateClient: (
		obj: ClientUpdate,
		luseId: number,
		idNum: string,
		isRecovery?: boolean,
		isAdmin?: string,
	) => Promise<GenericResponse>;

	getAgents: () => Promise<AgentIDs[]>;

	auditTicket: (ticketId: string) => Promise<GenericResponseWData<AuditRow[]>>;
	appendHistory: (obj: AddHistoryObj) => Promise<boolean>;

	// system ops
	getAllOtps: () => Promise<OTPRow[]>;
	getAllStaff: () => Promise<StaffRow[]>;
	addStaffMember: (obj: StaffInsertRow) => Promise<GenericResponseWData<StaffRow | undefined>>;
	blockStaffMember: (username: string, sender: string) => Promise<GenericResponse>;
	unblockStaffMember: (username: string, sender: string) => Promise<GenericResponse>;
	pauseOdyn: (username: string, sender: string) => Promise<GenericResponse>;
	unPauseOdyn: (username: string, sender: string) => Promise<GenericResponse>;

	// chat stuff
	sendChat: (
		obj: ChatInsert,
		notifCongif?: NotifConfigObj,
		skipNotif?: boolean,
	) => Promise<boolean>;
	/**AI only */
	sendChats: (obj: ChatInsert[]) => Promise<boolean>;
	/**Move chat from AI to human */
	humanifyChatWeb: (ticket: TicketRowLean) => Promise<GenericResponse>;
	getAllChatMessages: (ticketId: string) => Promise<ChatRow[]>;

	// odyn socials
	getAllSocials: () => Promise<SocialsRow[]>;

	// settlement
	/**get settled trades / portfolio based on 1 luse id */
	getFilteredSettledTrades: (luseId: number) => Promise<SettledTradeRow[]>;
	/**get settled trades / portfolio based on a historical diff from today */
	getDatedSettledTrades: (diff?: number) => Promise<SettledTradeRow[]>;
	settleTrades: (obj: SettledTradeInsert[], currency?: "zmw" | "usd") => Promise<GenericResponse>;

	// portfolio
	getClients: () => Promise<TempClientName[]>;
	updatePushId: (luseId: number, email: string, token: string) => Promise<boolean>;
	removePushId: (luseId: number, email: string) => Promise<boolean>;
	getPortfolio: (
		luseId: number,
		ytd?: number,
	) => Promise<GenericResponseWData<GetPortfolioData | undefined>>;

	// files
	getFiles: (id: string) => Promise<GenericResponseWData<Types["ClientKyc"][]>>;

	// utils
	getAgentStatus: () => Promise<ApiVersion>;
	getSiteStatus: () => Promise<ApiVersion>;
	getClientNameById: (luseIds: number[]) => Promise<TempClientNameTwo[]>;

	// requests
	getRequests: (tracking?: boolean) => Promise<ClientRow[]>;
	approveRequest: (
		idNum: string,
		fname: string,
		sender: string,
		email: string,
	) => Promise<GenericResponse>;
	rejectRequest: (
		idNum: string,
		luseId: string,
		fname: string,
		sender: string,
		email: string,
		reason: string,
	) => Promise<GenericResponse>;
}

const sbz = (): SBZutils => {
	// * System Stuff
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

	const _deepStat = async (obj: DeepStatInsert): Promise<void> => {
		try {
			const {} = await sbzdb.from("deep-stats").insert(obj);
		} catch (ex: any) {
			console.error("\nomnibot._deepStat ex\n", ex);
		}
	};

	const _getAllDeepStats = async (): Promise<DeepStat[]> => {
		try {
			const { data, error } = await sbzdb
				.from("deep-stats")
				.select()
				.order("created_at", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get Deep Stats Error" });
				return [];
			}

			return data;
		} catch (ex: any) {
			_log({ message: String(ex), title: "Get Deep Stats Exception" });
			return [];
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
			_log({ message: String(ex), title: "Check OTP Exception" });
			return { success: false, message: "Critical error, please try again in 5 minutes." };
		}
	};

	const _checkOtpTwo = async (obj: OTPObjTwo): Promise<GenericResponseWData<string>> => {
		try {
			const { data, error } = await sbzdb.from("otps").select("id,otp").in("id", obj.users);

			if (error) {
				await _log({ message: error.message, title: "Check OTP Error" });
				return {
					message: "Failed to get your OTP, please wait a few minutes and try again.",
					success: false,
					data: "",
				};
			}

			const correctData = {
				email: "",
				otp: obj.otp,
				good: false,
			};

			console.log({ data, obj });

			data.forEach((o) => {
				if (o.otp === correctData.otp) {
					correctData.email = o.id;
					correctData.good = true;
				}
			});

			if (!correctData.good)
				return { message: "Incorrect value entered!", success: false, data: "" };
			else return { message: "Redirecting...", success: true, data: correctData.email };
		} catch (ex: any) {
			_log({ message: String(ex), title: "Check OTP Exception" });
			return {
				success: false,
				message: "Critical error, please try again in 5 minutes.",
				data: "",
			};
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
			read_status: "read",
		};

		try {
			const { admin, adminEmail, reason, ticketId, clientEmail, assigneeVars, clientVars, names } =
				obj;

			const closeObj: CloseTicketReturnObj = {
				close_date: genDbTimestamp(),
				close_reason: reason,
				closed_by: admin,
				is_closed: true,
				read_status: "read",
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

			const clientMailReq = notif.email.sendNested(
				{
					subject: clientSubject.length ? clientSubject : `Ticket #${ticketId} Closed`,
					title: `Ticket Closed!`,
					body: `Hi <b>${names.split(" ")[0]}</b>,<br /><br /><b>${toTitleCase(admin)}</b> just closed this ticket with the following reason:`,
					extra: `<i>${reason}</i>`,
					link: `https://app.sbz.com.zm/track/${obj.ticketId}`,
					linkText: "View Chat",
				},
				/*IS_DEV ? "privatodato@gmail.com" :*/ clientEmail,
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

	const _reassignWebTicket = async (
		obj: ReassignByEmailObj,
		aiMode?: boolean,
	): Promise<GenericResponse> => {
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
					message: "Error during operation. Please refresh your browser.",
					success: false,
				};
			}

			if (adminsRes.error) {
				await _log({ message: adminsRes.error.message, title: "Reassign Ticket Error - 4" });
				return {
					message: "Failed to finish operation. Please refresh your browser.",
					success: false,
				};
			}

			const agents: TicketCandidateObjExt[] = [];

			ticketAdminsRes.data.forEach((r) => {
				const _d = new Date(r.created_at);
				const _m = _d.getMonth();

				const agentId = r.key.replace(".tickets", "");

				if (agentId === neew)
					agents.push({
						_id: r.id,
						email: "",
						name: "",
						phone: "",
						agentId,
						volume: Number(r.value),
						month: _m,
					});

				if (agentId === old && !aiMode)
					agents.push({
						_id: r.id,
						email: "",
						name: "",
						phone: "",
						agentId,
						volume: Number(r.value),
						month: _m,
					});
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

			await Promise.all([
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

	const _appendClientEmailVars = async (obj: AppendEmailVarsObj): Promise<boolean> => {
		try {
			const { error } = await sbzdb
				.from("odyn-tickets")
				.update({ email_vars: `${obj.msgId},,${obj.subject}` });

			if (error) {
				await _log({ message: error.message, title: "Append Client Email Vars Error" });
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

			_log({ message: error, title: "Append Client Email Vars Exception" });
			return false;
		}
	};

	const _getAllTickets = async (): Promise<TicketRowLean[]> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-tickets")
				.select(
					"assigned,close_date,created_at,email,id,id_num,is_closed,luse_id,names,phone,platform,query,query_type,referral_source,closed_by,email_vars,uid,assignee_email_vars,close_reason,read_status",
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

	// ? requests

	const _getRequests = async (tracking?: boolean): Promise<ClientRow[]> => {
		try {
			if (tracking) {
				const { data, error } = await sbzdb
					.from("clients")
					.select()
					.order("created_at", { ascending: false })
					.filter("created_at", "gt", "2025-11-30T02:00.000Z");

				if (error) {
					await _log({ message: error.message, title: "Get Requests Error" });
					return [];
				}

				return data;
			} else {
				const { data, error } = await sbzdb
					.from("clients")
					.select()
					.order("created_at", { ascending: true })
					.filter("luseId", "lt", 0)
					.filter("is_approved", "eq", false);

				if (error) {
					await _log({ message: error.message, title: "Get Requests Error" });
					return [];
				}

				return data;
			}
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Requests Exception" });
			return [];
		}
	};

	const _approveRequest = async (
		idNum: string,
		fname: string,
		sender: string,
		email: string,
	): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("clients")
				.update({ is_approved: true, approved_by: sender, approve_date: genDbTimestamp() })
				.filter("id_num", "eq", idNum);

			if (error) {
				await _log({ message: error.message, title: "Approve Request Error" });
				return { success: false, message: error.message };
			}

			const eReq = notif.email.sendUpdate(
				{
					body: `Hi ${fname},<br /><br />Your account opening request status has changed from <i>in review</i> to <b>approved</b>! Your account details will be sent to you within the next 24 hours.`,
					extra: "<b>NOTE</b> that account details are only sent on working days.",
					subject: "Account Opening Update | SBZ Digital",
					title: "Status Update",
				},
				email,
			);

			const histReq = _log({
				message: `${toTitleCase(sender)} just approved ${fname}'s (${idNum}) account!`,
				title: "Account Approved",
			});

			await Promise.all([eReq, histReq]);

			return { message: `${fname}'s account has been approved!`, success: true };
		} catch (ex: any) {
			_log({ message: String(ex), title: "Get Requests Exception" });
			return { message: String(ex), success: false };
		}
	};

	const _rejectRequest = async (
		idNum: string,
		luseId: string,
		fname: string,
		sender: string,
		email: string,
		reason: string,
	): Promise<GenericResponse> => {
		try {
			const { data: files, error: e1 } = await sbzdb.storage.from("kyc").list(idNum);

			if (e1) {
				await _log({ message: e1.message, title: "Reject Request E1" });
				return { success: false, message: e1.message };
			}

			const paths: string[] = [];

			files.forEach((f) => {
				paths.push(`${idNum}/${f.name}`);
			});

			const { error: e2 } = await sbzdb.storage.from("kyc").remove(paths);

			if (e2) {
				await _log({ message: e2.message, title: "Reject Request E2" });
				return { success: false, message: e2.message };
			}

			const { error } = await sbzdb.from("clients").delete().filter("luseId", "eq", luseId);

			if (error) {
				await _log({ message: error.message, title: "Reject Request E3" });
				return { success: false, message: error.message };
			}

			const eReq = notif.email.sendLink(
				{
					body: `Hi ${fname},<br /><br />Your account opening request status has changed from <i>in review</i> to <b>rejected</b> with the following reason:<br /><br /><i>${reason}</i>`,
					extra: "You may click above to retry when you're ready!",
					subject: "Account Opening Update | SBZ Digital",
					title: "Status Update",
					link: "https://app.sbz.com.zm/sign-up",
					linkText: "Retry",
				},
				email,
			);

			const histReq = _log({
				message: `${toTitleCase(sender)} just rejected ${fname}'s (${idNum}) account with reason: ${reason}!`,
				title: "Account Rejected",
			});

			await Promise.all([eReq, histReq]);

			return { message: `${fname}'s account has been rejected!`, success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Get Requests Exception" });
			return { message: String(ex), success: false };
		}
	};

	const _getOneTicket = async (ticketId: string): Promise<TicketRowLean> => {
		const emptyObj: TicketRowLean = {
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
			read_status: "unread",
		};

		try {
			const { data, error } = await sbzdb
				.from("odyn-tickets")
				.select(
					"assigned,close_date,created_at,email,id,id_num,is_closed,luse_id,names,phone,platform,query,query_type,referral_source,closed_by,email_vars,uid,assignee_email_vars,close_reason,read_status",
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

		// print(files);

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
				const ext = f.file instanceof Blob ? "png" : _getFileExtension(f.file);

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
			_log({ message: String(ex), title: "Upload KYC Exception" });
			return;
		}
	};

	const _uploadFiles = async (files: File[], ticketId: string): Promise<GenericResponse> => {
		try {
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

			files.forEach((f, i) => {
				const _f = sbzdb.storage.from("tmp").upload(`${ticketId}/${sanitizeFname(f.name)}`, f, {
					// 1 year in seconds
					cacheControl: "31536000",
					upsert: true,
					contentType: f.type,
				});

				promises.push(_f);
			});

			const res = await Promise.all(promises);

			const anyFails = res.filter((item) => item.error);

			if (anyFails.length) {
				anyFails.forEach((f) => {
					_log({
						message: `${f.error?.message}`,
						title: "Send File Error",
					});
				});

				return {
					message: "Failed to upload your file, please refresh and try again.",
					success: false,
				};
			}

			return {
				message: "",
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Send File Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
			};
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

			console.log({ data, error });

			if (error) {
				_log({
					message: error.message,
					title: "Get Admin Error",
				});
				return [];
			}

			if (data && data[0] && !data[0].approved) return [];

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
			const { data, error } = await sbzdb
				.from("clients")
				.select()
				.filter("luseId", "eq", luseId)
				.filter("is_approved", "eq", true);

			if (error) {
				_log({
					message: error.message,
					title: "Get Client Error",
				});
				console.log(error.message);
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

	const _updatePushId = async (luseId: number, email: string, token: string): Promise<boolean> => {
		try {
			const { error } = await sbzdb
				.from("push-ids")
				.upsert({ email, luse_id: luseId, id: token, updated_at: genDbTimestamp() })
				.filter("email", "eq", email);

			if (error) {
				_log({
					message: error.message,
					title: `Update Push Error - ${email} | ${luseId}`,
				});
				console.log(error.message);
				return false;
			}

			return true;
		} catch (ex: any) {
			_log({ message: String(ex), title: `Update Push Exception - ${email} | ${luseId}` });
			return false;
		}
	};

	const _removePushId = async (luseId: number, email: string): Promise<boolean> => {
		// console.log({ luseId, email });
		try {
			const { error } = await sbzdb.from("push-ids").delete().filter("email", "eq", email);

			if (error) {
				_log({
					message: error.message,
					title: `Delete Push Error - ${email} | ${luseId}`,
				});
				console.log(error.message);
				return false;
			}

			return true;
		} catch (ex: any) {
			_log({ message: String(ex), title: `Delete Push Exception - ${email} | ${luseId}` });
			return false;
		}
	};

	const _openAccount = async (
		obj: ClientInsert,
		autoApprove?: boolean,
		sender?: string,
	): Promise<GenericResponse> => {
		try {
			const tempId: number = Number(obj.id_num.replace(/\D+/g, "")) * -1;

			if (!obj.luseId) obj.luseId = tempId === 0 ? Math.floor(Math.random() * 999_999) : tempId;

			const firstCheck = await sbzdb.from("clients").select().filter("id_num", "eq", obj.id_num);

			if (firstCheck.error) {
				await _log({ message: firstCheck.error.message, title: "Open Account E1" });
				return {
					message: "Failed to validate, please wait a few minutes and try again.",
					success: false,
				};
			}

			if (firstCheck.data.length) {
				return {
					message:
						"You already have an account with us! Please select 'forgot password' to retrieve your account.",
					success: false,
				};
			}

			if (sender) {
				obj.opened_by = sender;
			}

			if (autoApprove) {
				obj.is_approved = true;
				obj.approved_by = sender;
			}

			if (obj.acc_type === "joint") {
				// @ts-ignore
				obj.dob = obj.joint_partners[0].dob;
				// @ts-ignore
				obj.manag_dob = obj.joint_partners[0].dob;
			}

			const { error } = await sbzdb.from("clients").insert(obj);

			// console.log({ obj });
			// print(obj);

			if (error) {
				await _log({ message: error.message, title: "Open Account E2" });
				return {
					message: "Failed to upload, please wait a few minutes and try again.",
					success: false,
				};
			}

			const internalEmail = !autoApprove
				? notif.email.sendLink(
						{
							subject: `New Account Request | ${obj.fname} ${obj.lname}`,
							title: `Account Opening`,
							body: `A new client <b>${obj.fname} ${obj.lname}</b> wants to open an account!. Please click below to review.`,
							link: `https://app.sbz.com.zm/admin/aco?q=${tempId}`,
							linkText: "View Request",
							extra: `This is a ${obj.country === "Zambia" ? "local" : "foreign"} client (currenly residing in ${obj.country}).`,
							cc: IS_DEV ? "sbzlewis@gmail.com" : "trading@sbz.com.zm",
						},
						"",
					)
				: null;

			const clientEmail = notif.email.sendUpdate(
				{
					subject: `Your Account Opening Request | SBZ Digital`,
					title: `Account Opening`,
					body: `Hi ${obj.fname},<br /><br />We have received your request and are currently processing your account opening! You will be notified via email on any status updates.`,
					extra: "Please note that we usually open accounts wihtin 24 hours on working days.",
					cc: autoApprove ? "trading@sbz.com.zm" : undefined,
				},
				obj.email,
			);

			await Promise.all([internalEmail, clientEmail]);

			return { message: "Successfully submitted your account opening request!", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Open Account Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
			};
		}
	};

	const _updateClient = async (
		obj: ClientUpdate,
		luseId: number,
		idNum: string,
		isRecovery: boolean = false,
		isAdmin?: string,
	): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb.from("clients").update(obj).filter("luseId", "eq", luseId);

			if (error) {
				await _log({ message: error.message, title: "Update Client Error" });
				return {
					message: "Failed to update, please wait a few minutes and try again.",
					success: false,
				};
			}

			let message: string = `Client ${luseId} just updated their details to ${JSON.stringify(obj)}`;

			if (isRecovery && obj.signatures) {
				// @ts-ignore
				message = `Client ${luseId} just used one of their recovery codes! They are left with ${obj.signatures.backups.backups[idNum].length}`;
			}

			if (isAdmin) {
				message = `Admin '${toTitleCase(isAdmin)}' updateed client '${luseId}' details to ${JSON.stringify(obj)}`;
			}

			await _log({ message, title: "Client Details Update" });

			return { message: "Account successfully updated!", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Open Account Exception" });
			return {
				success: false,
				message: "Server error, please wait 10 minutes and try again.",
			};
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

	const _blockStaffMember = async (username: string, sender: string): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("admins")
				.update({ approved: false })
				.filter("username", "eq", username);

			if (error) {
				_log({ message: error.message, title: "Block Staff Error" });
				return { message: error.message, success: false };
			}

			await _log({
				title: "Account Blocked",
				message: `${toTitleCase(sender)} blocked ${toTitleCase(username)}'s account.`,
			});

			return {
				message: `${toTitleCase(username)}'s system access has been revoked.`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Block Staff Exception" });
			return { message: error, success: false };
		}
	};

	const _unblockStaffMember = async (
		username: string,
		sender: string,
	): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("admins")
				.update({ approved: true })
				.filter("username", "eq", username);

			if (error) {
				_log({ message: error.message, title: "Unblock Staff Error" });
				return { message: error.message, success: false };
			}

			await _log({
				title: "Account Unblocked",
				message: `${toTitleCase(sender)} unblocked ${toTitleCase(username)}'s account.`,
			});

			return {
				message: `${toTitleCase(username)}'s system access has been reinstated.`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Unblock Staff Exception" });
			return { message: error, success: false };
		}
	};

	const _pauseOdyn = async (username: string, sender: string): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("admins")
				.update({ ticketable: false })
				.filter("username", "eq", username);

			if (error) {
				_log({ message: error.message, title: "Pause Odyn Error" });
				return { message: error.message, success: false };
			}

			await _log({
				title: "Odyn Paused",
				message: `${toTitleCase(sender)} paused Odyn for ${toTitleCase(username)}'s account.`,
			});

			return {
				message: `${toTitleCase(username)}'s is now marked as on leave!`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Pause Odyn Exception" });
			return { message: error, success: false };
		}
	};

	const _unPauseOdyn = async (username: string, sender: string): Promise<GenericResponse> => {
		try {
			const { error } = await sbzdb
				.from("admins")
				.update({ ticketable: true })
				.filter("username", "eq", username);

			if (error) {
				_log({ message: error.message, title: "Unpause Odyn Error" });
				return { message: error.message, success: false };
			}

			await _log({
				title: "Odyn Unpaused",
				message: `${toTitleCase(sender)} unpaused Odyn for ${toTitleCase(username)}'s account.`,
			});

			return {
				message: `${toTitleCase(username)}'s is now marked as on duty!`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: "Unpause Odyn Exception" });
			return { message: error, success: false };
		}
	};

	// * chat stuff
	const _sendChat = async (
		obj: ChatInsert,
		notifCongif?: NotifConfigObj,
		skipNotif?: boolean,
	): Promise<boolean> => {
		const oldBody = obj.body;
		obj.body = tokenise.encode(oldBody);

		const isFirstLower = (str: string) => /^[a-z]/.test(str);

		try {
			const chat = sbzdb.from("odyn-chats").insert(obj);
			const ticket = sbzdb
				.from("odyn-tickets")
				.update({ read_status: isFirstLower(obj.sender) ? "read" : "unread" })
				.filter("id", "eq", obj.ticket_no);

			const [chats, _] = await Promise.all([chat, ticket]);

			if (chats.error) {
				_log({ message: chats.error.message, title: "Send Chat Error" });
				return false;
			}

			if (notifCongif && !skipNotif) {
				const arr = oldBody.split(",,");
				const names: string[] = [];

				if (arr.length) {
					arr.forEach((l) => {
						names.push(fileNamifier(l));
					});
				}

				const msg =
					obj.type && obj.type === "pdf"
						? `Hi ${notifCongif.name}<br /><br /><b>${toTitleCase(obj.sender.split(" ")[0])}</b> has just responded to your message with a file(s):<br /><i>${names.join(", ")}</i>`
						: `Hi ${notifCongif.name}<br /><br /><b>${toTitleCase(obj.sender.split(" ")[0])}</b> has just responded to your message with:<br /><i>${oldBody}</i>`;

				const link = notifCongif.email.includes("@sbz")
					? `https://app.sbz.com.zm/admin/tickets?q=${obj.ticket_no}&chat=true`
					: `https://app.sbz.com.zm/track/${obj.ticket_no}`;

				await notif.email.sendNested(
					{
						subject: notifCongif.subject,
						title: "New Response!",
						body: msg,
						extra: `Click the button above to respond!`,
						link,
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

	// ai specifically
	const _sendChats = async (obj: ChatInsert[]): Promise<boolean> => {
		const objs = obj.map((chat) => {
			const oldBody = chat.body;
			chat.body = tokenise.encode(oldBody);
			return chat;
		});

		try {
			const { error } = await sbzdb.from("odyn-chats").insert(objs);

			if (error) {
				_log({ message: error.message, title: "Send Chat Error" });
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

	// * odyn socials
	const _getAllSocials = async (): Promise<SocialsRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-socials")
				.select()
				.order("date", { ascending: false });

			if (error) return [];

			return data;
		} catch {
			return [];
		}
	};

	// * settlement

	// get settled trades / portfolio based on 1 luse id
	const _getFilteredSettledTrades = async (luseId: number): Promise<SettledTradeRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("settled_trades")
				.select()
				.eq("luse_id", luseId)
				.order("date", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get Filtered Settled Error" });
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

			_log({ message: error, title: "Get Filtered Settled Exception" });
			return [];
		}
	};

	// get settled trades / portfolio based on a historical diff from today
	const _getDatedSettledTrades = async (diff: number = 31): Promise<SettledTradeRow[]> => {
		const oldDate = getOldDate(genDate(), diff);

		try {
			const { data, error } = await sbzdb
				.from("settled_trades")
				.select()
				.filter("date", "gte", oldDate)
				.order("date", { ascending: false });

			if (error) {
				await _log({ message: error.message, title: "Get Settled Error" });
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

			_log({ message: error, title: "Get Settled Exception" });
			return [];
		}
	};

	const _settleTrades = async (
		obj: SettledTradeInsert[],
		currency: "zmw" | "usd" = "zmw",
	): Promise<GenericResponse> => {
		try {
			/*
			const { data, error } = await sbzdb.from("settled_trades").select("date");
			// .eq("date", obj[0].date);
			//.eq("currency", currency);

			if (error) {
				await _log({ message: error.message, title: `Settle Error - 1` });
				return {
					success: false,
					message: error.message,
				};
			}

			if (data.length) {
				return {
					success: false,
					message: `The settlement has already been done for ${prettyDate(obj[0].date)}!`,
				};
			}
			*/

			const { error: e2 } = await sbzdb.from("settled_trades").insert(obj);

			if (e2) {
				await _log({ message: e2.message, title: `Settle Error - 2` });
				return {
					message: e2.message,
					success: false,
				};
			}

			return {
				message: `settlement for ${prettyDate(obj[0].date)} completed!`,
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ message: error, title: `Settle Exception` });
			return { success: false, message: "Server error, please wait 10 minutes and try again." };
		}
	};

	const _getClients = async (): Promise<TempClientName[]> => {
		try {
			const { data, error } = await sbzdb
				.from("clients")
				.select()
				.order("luseId", { ascending: true })
				.filter("luseId", "gte", 0);

			if (error) {
				await _log({ message: error.message, title: `Get Clients Error` });
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

			_log({ message: error, title: `Get Clients Exception` });
			return [];
		}
	};

	// * portfolio stuff
	const _getPortfolio = async (
		luseId: number,
		ytd?: number,
	): Promise<GenericResponseWData<GetPortfolioData | undefined>> => {
		const oldDate = getOldDate(genDate(), 5);

		try {
			if (ytd) {
				const settledReq = sbzdb
					.from("settled_trades")
					.select()
					.filter("luse_id", "eq", luseId)
					.filter("date", "lte", `${ytd}1231`)
					.order("date", { ascending: true });
				const matchedReq = nfdb
					.from("sbz-matched-trades")
					.select()
					.filter("luse_id", "eq", luseId)
					.filter("trade_date", "lte", `${ytd}1231`)
					.order("trade_date", { ascending: false });
				const onScreenReq = nfdb
					.from("on-screen-orders")
					.select()
					.filter("luse_id", "eq", luseId)
					.filter("date", "lte", `${ytd}1231`)
					.order("date", { ascending: false });
				const dmrReq = nfdb
					.from("sbz-dmb")
					.select()
					//.filter("date", "gte", oldDate)
					.filter("source", "eq", "luse")
					.filter("date", "lte", `${ytd}1231`)
					.limit(150)
					.order("date", { ascending: false });
				const fxUsdReq = nfdb
					.from("fx")
					.select()
					//.filter("date", "gte", oldDate)
					.filter("source", "eq", "BOZ")
					.filter("currency", "eq", "USD/ZMW")
					.filter("date", "lte", `${ytd}1231`)
					.limit(30)
					.order("date", { ascending: false });

				const [settledRes, matchedRes, onScreenRes, dmrRes, fxUsdRes] = await Promise.all([
					settledReq,
					matchedReq,
					onScreenReq,
					dmrReq,
					fxUsdReq,
				]);

				if (settledRes.error) {
					await _log({ message: settledRes.error.message, title: `Get ${luseId}LI Holdings - E1` });
					return {
						data: undefined,
						message: "Failed to get this portfolio, please try again in a few minutes.",
						success: false,
					};
				}

				if (matchedRes.error) {
					await _log({ message: matchedRes.error.message, title: `Get ${luseId}LI Holdings - E2` });
					return {
						data: undefined,
						message: "Failed to get trade history, please try again in a few minutes.",
						success: false,
					};
				}

				if (onScreenRes.error) {
					await _log({
						message: onScreenRes.error.message,
						title: `Get ${luseId}LI Holdings - E3`,
					});
					return {
						data: undefined,
						message: "Failed to get on screen orders, please try again in a few minutes.",
						success: false,
					};
				}

				if (dmrRes.error) {
					await _log({ message: dmrRes.error.message, title: `Get ${luseId}LI Holdings - E4` });
					return {
						data: undefined,
						message: "Failed to get recent stock prices, please try again in a few minutes.",
						success: false,
					};
				}

				if (fxUsdRes.error) {
					await _log({ message: fxUsdRes.error.message, title: `Get ${luseId}LI Holdings - E5` });
					return {
						data: undefined,
						message: "Failed to get recent fx rates, please try again in a few minutes.",
						success: false,
					};
				}

				const fxUsd = fxUsdRes.data[0];
				const _date = dmrRes.data[0].date;
				const dmr = dmrRes.data.filter((item) => item.date === _date);

				return {
					data: {
						dmr,
						fxUsd,
						onScreen: onScreenRes.data,
						matched: matchedRes.data,
						settled: settledRes.data,
					},
					message: "",
					success: true,
				};
			}

			const settledReq = sbzdb
				.from("settled_trades")
				.select()
				.filter("luse_id", "eq", luseId)
				.order("date", { ascending: true });
			const matchedReq = nfdb
				.from("sbz-matched-trades")
				.select()
				.filter("luse_id", "eq", luseId)
				.order("trade_date", { ascending: false });
			const onScreenReq = nfdb
				.from("on-screen-orders")
				.select()
				.filter("luse_id", "eq", luseId)
				.order("date", { ascending: false });
			const dmrReq = nfdb
				.from("sbz-dmb")
				.select()
				.filter("date", "gte", oldDate)
				.filter("source", "eq", "luse")
				.order("date", { ascending: false });
			const fxUsdReq = nfdb
				.from("fx")
				.select()
				.filter("date", "gte", oldDate)
				.filter("source", "eq", "BOZ")
				.filter("currency", "eq", "USD/ZMW")
				.order("date", { ascending: false });

			const [settledRes, matchedRes, onScreenRes, dmrRes, fxUsdRes] = await Promise.all([
				settledReq,
				matchedReq,
				onScreenReq,
				dmrReq,
				fxUsdReq,
			]);

			if (settledRes.error) {
				await _log({ message: settledRes.error.message, title: `Get ${luseId}LI Holdings - E1` });
				return {
					data: undefined,
					message: "Failed to get this portfolio, please try again in a few minutes.",
					success: false,
				};
			}

			if (matchedRes.error) {
				await _log({ message: matchedRes.error.message, title: `Get ${luseId}LI Holdings - E2` });
				return {
					data: undefined,
					message: "Failed to get trade history, please try again in a few minutes.",
					success: false,
				};
			}

			if (onScreenRes.error) {
				await _log({ message: onScreenRes.error.message, title: `Get ${luseId}LI Holdings - E3` });
				return {
					data: undefined,
					message: "Failed to get on screen orders, please try again in a few minutes.",
					success: false,
				};
			}

			if (dmrRes.error) {
				await _log({ message: dmrRes.error.message, title: `Get ${luseId}LI Holdings - E4` });
				return {
					data: undefined,
					message: "Failed to get recent stock prices, please try again in a few minutes.",
					success: false,
				};
			}

			if (fxUsdRes.error) {
				await _log({ message: fxUsdRes.error.message, title: `Get ${luseId}LI Holdings - E5` });
				return {
					data: undefined,
					message: "Failed to get recent fx rates, please try again in a few minutes.",
					success: false,
				};
			}

			const fxUsd = fxUsdRes.data[0];
			const _date = dmrRes.data[0].date;
			const dmr = dmrRes.data.filter((item) => item.date === _date);

			return {
				data: {
					dmr,
					fxUsd,
					onScreen: onScreenRes.data,
					matched: matchedRes.data,
					settled: settledRes.data,
				},
				message: "",
				success: true,
			};
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);
			console.error("\n=== get portfolio ex\n", ex, "\n");

			_log({ message: error, title: `Get Portfolio Exception` });
			return { data: undefined, message: error, success: false };
		}
	};

	// * file stuff
	const _getFiles = async (id: string): Promise<GenericResponseWData<Types["ClientKyc"][]>> => {
		try {
			const { data: fileNames, error: e1 } = await sbzdb.storage.from("kyc").list(id);

			if (e1) {
				await _log({ message: e1.message, title: `Get Files ${id} - E1` });
				return {
					data: [],
					message: e1.message,
					success: false,
				};
			}

			const fileUrls = await Promise.all(
				fileNames.map((n) => sbzdb.storage.from("kyc").createSignedUrl(`${id}/${n.name}`, 3600)),
			);

			const _titleIfier = (url: string): string => {
				const urlSegments = url.split("/");
				const name = urlSegments[urlSegments.length - 1];
				const tag = name.split("-")[0];

				switch (tag) {
					case "aco":
						return "Account Opening Form";
					case "poa":
						return "Proof Of Address";
					case "poi":
						return "Proof Of Identity";
					case "selfie":
						return "Selfie";
					default:
						return "Unkown";
				}
			};

			const clientFiles: Types["ClientKyc"][] = [];
			const clientFileErrors: string[] = [];

			fileUrls.forEach((f) => {
				if (f.data) {
					const title = _titleIfier(f.data.signedUrl);
					clientFiles.push({ title, url: f.data.signedUrl });
				}

				if (f.error) {
					clientFileErrors.push(f.error.message);
				}
			});

			return { data: clientFiles, message: "", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);
			console.error("\n=== get files ex\n", ex, "\n");

			_log({ message: error, title: `Get Files Exception` });
			return { data: [], message: error, success: false };
		}
	};

	// * utils
	const _getAgentStatus = async (): Promise<ApiVersion> => {
		try {
			const req = await fetch(`${SERVER_BASE_URL}/health`);

			const res = await req.json();

			return res;
		} catch {
			return { success: false, version: "-1" };
		}
	};

	// check the status of the Site
	const _getSiteStatus = async (): Promise<ApiVersion> => {
		try {
			return { success: true, version: manifest.version };
		} catch {
			return { success: false, version: "-1" };
		}
	};

	const _getClientNameById = async (luseIds: number[]): Promise<TempClientNameTwo[]> => {
		try {
			const { data, error } = await sbzdb
				.from("clients")
				.select("luseId,created_at,fname,lname,broker_comission")
				.in("luseId", luseIds);

			//console.log({ data, error, luseIds });

			if (error) return [];

			const _data: TempClientNameTwo[] = [];

			data.forEach((v) => {
				_data.push({
					broker_comission: v.broker_comission,
					created_at: v.created_at,
					luse_id: v.luseId,
					names: `${v.fname} ${v.lname}`.trim(),
				});
			});

			return _data;
		} catch {
			return [];
		}
	};

	return {
		log: _log,
		setOtp: _setOtp,
		setBulkOtp: _setBulkOtp,
		checkOtp: _checkOtp,
		checkOtpTwo: _checkOtpTwo,
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
		appendClientEmailVars: _appendClientEmailVars,
		auditTicket: _auditTicket,
		appendHistory: _appendHistory,
		getAllLogs: _getAllLogs,
		getAllOtps: _getAllOtps,
		getAllStaff: _getAllStaff,
		addStaffMember: _addStaffMember,
		getAllChatMessages: _getAllChatMessages,
		humanifyChatWeb: _humanifyChatWeb,
		sendChat: _sendChat,
		sendChats: _sendChats,
		getAllSocials: _getAllSocials,
		getAgentStatus: _getAgentStatus,
		getSiteStatus: _getSiteStatus,
		getClientNameById: _getClientNameById,
		getDatedSettledTrades: _getDatedSettledTrades,
		getFilteredSettledTrades: _getFilteredSettledTrades,
		settleTrades: _settleTrades,
		getClients: _getClients,
		updatePushId: _updatePushId,
		removePushId: _removePushId,
		getPortfolio: _getPortfolio,
		getFiles: _getFiles,
		blockStaffMember: _blockStaffMember,
		unblockStaffMember: _unblockStaffMember,
		pauseOdyn: _pauseOdyn,
		unPauseOdyn: _unPauseOdyn,
		uploadFiles: _uploadFiles,
		openAccount: _openAccount,
		updateClient: _updateClient,
		approveRequest: _approveRequest,
		getRequests: _getRequests,
		rejectRequest: _rejectRequest,
		deepStat: _deepStat,
		getAllDeepStats: _getAllDeepStats,
	};
};

// ? NeuroFlow DB functions

type MatchedTrade = NFdb["public"]["Tables"]["sbz-matched-trades"]["Row"];

interface GetMatchedResponse {
	trades: MatchedTrade[];
}

type OnSCreenOrder = NFdb["public"]["Tables"]["on-screen-orders"]["Row"];

interface GetOnScreenResponse {
	trades: OnSCreenOrder[];
}

interface GetNewsLeanResponse {
	news: NewsLean[];
}

type StockData = NFdb["public"]["Tables"]["sbz-dmb"]["Row"];

interface GetStocksReturn {
	market: StockData[];
}

type FxData = NFdb["public"]["Tables"]["fx"]["Row"];

interface GetFxReturn {
	fx: FxData[];
}

type Recommendation = NFdb["public"]["Tables"]["symbol-recommendations"]["Row"];

interface GetRecommendationsReturn {
	recommendations: Recommendation[];
}

interface NFutils {
	/**Get the mathced trades from the db. Needs to be updated to include date filtering */
	getMatchedTrades: (luseId?: number, diff?: number, wDate?: number) => Promise<GetMatchedResponse>;
	/**Get the on screen orders from the db. Needs to be updated to include date filtering */
	getOnScreenOrders: (luseId?: number, diff?: number) => Promise<GetOnScreenResponse>;
	/**Get the news from the db. Needs to be updated to include date filtering */
	getNewsLean: (exchange?: string, history?: number) => Promise<GetNewsLeanResponse>;
	/**Get an article's pdf json to be cached on the client */
	getArticleJson: (id: number) => Promise<GenericResponseWData<any | undefined>>;
	/**Get the DMR from the db */
	getStocks: (date?: number) => Promise<GetStocksReturn>;
	/**Get the first day of the year DMR from the db */
	getFirstStocks: (date?: number) => Promise<GetStocksReturn>;
	expandStock: (
		symbol: string,
	) => Promise<GenericResponseWData<NFHelp["ExpandedSymbolReturn"] | undefined>>;
	getLastFxData: (d?: number, diff?: number) => Promise<GetFxReturn>;
	getRecommendations: () => Promise<GetRecommendationsReturn>;
}

const nf = (): NFutils => {
	const _getMatchedTrades = async (
		luseId?: number,
		diff: number = 31,
		wDate?: number,
	): Promise<GetMatchedResponse> => {
		const oldDate = getOldDate(genDate(), diff);

		try {
			const { data, error } =
				wDate && luseId
					? await nfdb
							.from("sbz-matched-trades")
							.select()
							.filter("luse_id", "eq", luseId)
							.filter("trade_date", "eq", wDate)
							.order("trade_date", { ascending: false })
					: luseId
						? await nfdb
								.from("sbz-matched-trades")
								.select()
								.filter("luse_id", "eq", luseId)
								.order("trade_date", { ascending: false })
						: await nfdb
								.from("sbz-matched-trades")
								.select()
								.filter("trade_date", "gte", oldDate)
								.order("trade_date", { ascending: false });

			if (error) {
				console.error("\n\nGET MATCHED ERROR", error, "\n\n");
				return {
					trades: [],
				};
			}

			return { trades: data };
		} catch (ex: any) {
			return { trades: [] };
		}
	};

	const _getOnScreenOrders = async (
		luseId?: number,
		diff: number = 31,
	): Promise<GetOnScreenResponse> => {
		const oldDate = getOldDate(genDate(), diff);

		try {
			const { data, error } = luseId
				? await nfdb
						.from("on-screen-orders")
						.select()
						.eq("luse_id", luseId)
						.order("date", { ascending: false })
				: await nfdb
						.from("on-screen-orders")
						.select()
						.filter("date", "gte", oldDate)
						.order("date", { ascending: false });

			if (error) return { trades: [] };

			return { trades: data };
		} catch (ex: any) {
			return { trades: [] };
		}
	};

	const _getNewsLean = async (
		exchange: string = "LuSE",
		history: number = 63,
	): Promise<GetNewsLeanResponse> => {
		const oldDate = getOldDate(genDate(), history);

		try {
			const { data, error } = await nfdb
				.from("news")
				.select("id,symbol,title,date,summary,analyst")
				.filter("date", "gte", oldDate)
				.eq("exchange", exchange)
				.order("date", { ascending: false });

			if (error) {
				console.error("\n\n=== Get news lean error\n", error.message, "\n\n");
				return { news: [] };
			}

			return { news: data };
		} catch (ex: any) {
			console.error("\n\n=== Get news lean EX\n", ex, "\n\n");
			return { news: [] };
		}
	};

	const _getArticleJson = async (id: number): Promise<GenericResponseWData<any | undefined>> => {
		try {
			const { data, error } = await nfdb.from("news").select("pdf_json").eq("id", id);

			if (error) {
				console.error("\n\n=== Get article json error\n", error.message, "\n\n");
				return { data: undefined, message: error.message, success: false };
			}

			if (!data.length)
				return {
					data: undefined,
					message: "No document corresponds to this article.",
					success: false,
				};

			return { data: data[0].pdf_json, message: "", success: true };
		} catch (ex: any) {
			console.error("\n\n=== Get article json EX\n", ex, "\n\n");
			return {
				data: undefined,
				message: "Server error, please wait a few minutes and try again.",
				success: false,
			};
		}
	};

	const _getStocks = async (date: number = 31): Promise<GetStocksReturn> => {
		const oldDate = getOldDate(genDate(), date);

		try {
			const { data, error } = await nfdb
				.from("sbz-dmb")
				.select()
				.filter("date", "gte", oldDate)
				.eq("source", "luse")
				.order("date", { ascending: false });

			if (error) {
				console.error("\n\n=== Get stocks error\n", error.message, "\n\n");
				return { market: [] };
			}

			return { market: data };
		} catch (ex: any) {
			console.error("\n\n=== Get stocks exception\n", ex, "\n\n");
			return { market: [] };
		}
	};

	const _getFirstStocks = async (date?: number): Promise<GetStocksReturn> => {
		try {
			const { data, error } = date
				? await nfdb
						.from("sbz-dmb")
						.select()
						.filter("is_first", "eq", true)
						.filter("date", "lt", date)
						.limit(80)
						.eq("source", "luse")
						.order("date", { ascending: false })
				: await nfdb
						.from("sbz-dmb")
						.select()
						.filter("is_first", "eq", true)
						.limit(80)
						.eq("source", "luse")
						.order("date", { ascending: false });

			if (error) {
				console.error("\n\n=== Get First Stocks Error\n", error.message, "\n\n");
				return { market: [] };
			}

			const market = data.filter((item) => item.date === data[0].date);

			return { market };
		} catch (ex: any) {
			console.error("\n\n=== Get First Stocks exception\n", ex, "\n\n");
			return { market: [] };
		}
	};

	const _expandStock = async (
		symbol: string,
	): Promise<GenericResponseWData<NFHelp["ExpandedSymbolReturn"] | undefined>> => {
		console.log({ symbol });
		try {
			const fundamentalsReq = nfdb
				.from("symbol-metrics")
				.select()
				.filter("symbol", "eq", symbol)
				.eq("exchange", "LuSE")
				.order("date", { ascending: false })
				.limit(1);

			const balanceReq = nfdb
				.from("balance-sheets")
				.select()
				.filter("symbol", "eq", symbol)
				.eq("exchange", "LuSE")
				.order("date", { ascending: false });

			const incomeReq = nfdb
				.from("income-statements")
				.select()
				.filter("symbol", "eq", symbol)
				.eq("exchange", "LuSE")
				.order("date", { ascending: false });

			const cashFlowReq = nfdb
				.from("cash-flow-statements")
				.select()
				.filter("symbol", "eq", symbol)
				.eq("exchange", "LuSE")
				.order("date", { ascending: false });

			const [fundamentalsRes, balanceRes, incomeRes, cashFlowRes] = await Promise.all([
				fundamentalsReq,
				balanceReq,
				incomeReq,
				cashFlowReq,
				cashFlowReq,
			]);

			if (fundamentalsRes.error)
				return {
					data: undefined,
					message: fundamentalsRes.error.message,
					success: false,
				};

			if (balanceRes.error)
				return {
					data: undefined,
					message: balanceRes.error.message,
					success: false,
				};

			if (incomeRes.error)
				return {
					data: undefined,
					message: incomeRes.error.message,
					success: false,
				};

			if (cashFlowRes.error)
				return {
					data: undefined,
					message: cashFlowRes.error.message,
					success: false,
				};

			console.log();

			return {
				message: "",
				success: true,
				data: {
					balance: balanceRes.data,
					cashFlow: cashFlowRes.data,
					fundamentals: fundamentalsRes.data,
					income: incomeRes.data,
				},
			};
		} catch (ex: any) {
			console.error(`\n\n=== Expand stock ${symbol} exception\n`, ex, "\n\n");
			return {
				data: undefined,
				message: String(ex),
				success: false,
			};
		}
	};

	/**Get the BOZ Fx from the db for a specific period. Needs to be updated to include date filtering */
	const _getLastFxData = async (d?: number, diff: number = 10): Promise<GetFxReturn> => {
		const oldDate = getOldDate(d ? d : genDate(), diff);
		const currentDate = genDate();

		try {
			const { data, error } = await nfdb
				.from("fx")
				.select()
				.filter("date", "gte", oldDate)
				.filter("date", "lt", currentDate)
				.eq("source", "BOZ")
				.order("date", { ascending: false });

			if (error) {
				console.error(`\n\n=== Get last fx error\n`, error, "\n\n");
				return { fx: [] };
			}

			return { fx: data };
		} catch (ex: any) {
			return { fx: [] };
		}
	};

	/**Get the symbol recommendations db */
	const _getRecommendations = async (): Promise<GetRecommendationsReturn> => {
		const oldDate = getOldDate(genDate(), 31);

		try {
			const { data, error } = await nfdb
				.from("symbol-recommendations")
				.select()
				.eq("analyst", "Stockbrokers")
				.order("date", { ascending: false })
				.limit(1);

			if (error) {
				console.error(`\n\n=== Get recommendation error\n`, error, "\n\n");
				return { recommendations: [] };
			}

			return { recommendations: data };
		} catch (ex: any) {
			return { recommendations: [] };
		}
	};

	return {
		getMatchedTrades: _getMatchedTrades,
		getOnScreenOrders: _getOnScreenOrders,
		getNewsLean: _getNewsLean,
		getArticleJson: _getArticleJson,
		getStocks: _getStocks,
		getFirstStocks: _getFirstStocks,
		expandStock: _expandStock,
		getLastFxData: _getLastFxData,
		getRecommendations: _getRecommendations,
	};
};

// end

export { sbz, nf };
