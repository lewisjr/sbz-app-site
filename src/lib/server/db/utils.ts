import notif from "../email";
import { nfdb, sbzdb } from "./db";
import { genDbTimestamp, randomAb, genId } from "$lib/utils";
import { toTitleCase } from "@cerebrusinc/fstring";

import type { SBZdb } from "$lib/types";
import type { StorageError } from "@supabase/storage-js";

import { DEV } from "$env/static/private";
const IS_DEV = DEV === "y";

// * SBZ DB functions
interface GenericResponse {
	success: boolean;
	message: string;
}

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

interface GenericResponseWData<T> extends GenericResponse {
	data: T;
}

type OdynInsert = SBZdb["public"]["Tables"]["odyn-tickets"]["Insert"];

export interface FileData {
	id: string;
	type: "poi" | "poa";
	file: File;
}

type AdminRow = SBZdb["public"]["Tables"]["admins"]["Row"];
type ClientRow = SBZdb["public"]["Tables"]["clients"]["Row"];
type TicketRow = SBZdb["public"]["Tables"]["odyn-tickets"]["Row"];

interface AgentIDs {
	username: string;
}

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
	getAllTickets: () => Promise<TicketRow[]>;
	uploadKyc: (files: FileData[]) => Promise<void>;

	isAdminCorrect: (username: string) => Promise<boolean>;
	getAdmin: (username: string) => Promise<AdminRow[]>;
	// getAdmins: () => Promise<AdminRow[]>;
	isClientCorrect: (luseId: number) => Promise<boolean>;
	getClient: (luseId: number) => Promise<ClientRow[]>;

	getAgents: () => Promise<AgentIDs[]>;
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

			notif.email.sendLink(
				{
					subject: `New Ticket | ${obj.query_type} ${ticket}`,
					title: `Ticket ${ticket}`,
					body: `A new <b>${obj.query_type}</b> ticket has been opened and assigned to <b>${toTitleCase(obj.assigned)}</b>. Please click below to review.`,
					link: `https://app.sbz.com.zm/admin/tickets?q=${ticket}`,
					linkText: "View Ticket",
					extra: obj.query.length ? `Original query:<br />${obj.query}` : "",
					cc: IS_DEV ? "sbzlewis@gmail.com" : "trading@sbz.com.zm",
				},
				IS_DEV ? "privatodato@gmail.com" : agent.email,
			);

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

	const _getAllTickets = async (): Promise<TicketRow[]> => {
		try {
			const { data, error } = await sbzdb
				.from("odyn-tickets")
				.select()
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

	const _updateTicketCandidate = async (obj: TicketCandidateObjExt): Promise<void> => {
		try {
			const currentMonth = new Date().getMonth();

			let ex: any = null;

			if (currentMonth === obj.month && obj._id > -1) {
				const { error } = await sbzdb
					.from("system-vars")
					.update({ value: (obj.volume + 1).toString() })
					.eq("id", obj._id);
				ex = error;
			} else {
				const { error } = await sbzdb
					.from("system-vars")
					.insert({ value: (obj.volume + 1).toString(), key: `${obj.agentId}.tickets` });
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
				.filter("username", "eq", username);

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
				.filter("luseId", "eq", luseId);

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

	return {
		log: _log,
		setOtp: _setOtp,
		setBulkOtp: _setBulkOtp,
		checkOtp: _checkOtp,
		getTicketCandidate: _getTicketCandidate,
		createTicket: _createTicket,
		getAllTickets: _getAllTickets,
		updateTicketCandidate: _updateTicketCandidate,
		uploadKyc: _uploadKyc,
		getAdmin: _getAdmin,
		isAdminCorrect: _isAdminCorrect,
		getClient: _getClient,
		isClientCorrect: _isClientCorrect,
		getAgents: _getAgents,
	};
};

// ? NeuroFlow DB functions
interface NFutils {}

const nf = (): NFutils => {
	return {};
};

// end

export { sbz, nf };
