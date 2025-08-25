import { nfdb, sbzdb } from "./db";
import { genDbTimestamp, randomAb, genId } from "$lib/utils";

import type { SBZdb } from "$lib/types";

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

interface TicketCandidateObj {
	name: string;
	userId: string;
	email: string;
	phone: string;
	/**The specific id of the current user's ticket obj in the `system-vars` table */
	_id: number;
}
interface TicketCandidateObjExt extends TicketCandidateObj {
	volume: number;
}

interface GenericResponseWData<T> extends GenericResponse {
	data: T;
}

type OdynInsert = SBZdb["public"]["Tables"]["odyn-tickets"]["Insert"];

interface SBZutils {
	log: (obj: LogObj) => Promise<void>;
	setOtp: (obj: OTPObj) => Promise<GenericResponse>;
	checkOtp: (obj: OTPObj) => Promise<GenericResponse>;
	getTicketCandidate: () => Promise<GenericResponseWData<TicketCandidateObj>>;
	createTicket: (obj: OdynInsert) => Promise<GenericResponseWData<string>>;
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

			return { message: "Please check your Whatsapp or email for the OTP.", success: true };
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

	const _getTicketCandidate = async (): Promise<GenericResponseWData<TicketCandidateObj>> => {
		/**First day of the current month */
		const fdm = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

		/**First day of the next month */
		const fdnm = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

		let data: TicketCandidateObj = { email: "", name: "", phone: "", userId: "", _id: -1 };

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
				return {
					_id: r.id,
					email: "",
					name: "",
					phone: "",
					userId: r.key.replace(".tickets", ""),
					volume: Number(r.value),
				};
			});

			const toConsinderArr: TicketCandidateObjExt[] = [];

			adminsRes.data.forEach((agent) => {
				const alreadyExisting = agents.find((item) => item.userId === agent.username);

				if (alreadyExisting)
					toConsinderArr.push({
						_id: alreadyExisting._id,
						email: agent.email,
						name: agent.full_names,
						phone: agent.phone,
						userId: agent.username,
						volume: alreadyExisting.volume,
					});
				else
					toConsinderArr.push({
						_id: -1,
						email: agent.email,
						name: agent.full_names,
						phone: agent.phone,
						userId: agent.username,
						volume: 0,
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

	const _createTicket = async (obj: OdynInsert): Promise<GenericResponseWData<string>> => {
		try {
			const ticket = genId();

			const { error } = await sbzdb.from("odyn-tickets").insert(obj);

			if (error) {
				await _log({ message: error.message, title: "Create Ticket Error" });
				return { data: "", message: error.message, success: false };
			}

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

	return {
		log: _log,
		setOtp: _setOtp,
		checkOtp: _checkOtp,
		getTicketCandidate: _getTicketCandidate,
		createTicket: _createTicket,
	};
};

// ? NeuroFlow DB functions
interface NFutils {}

const nf = (): NFutils => {
	return {};
};

// end

export { sbz, nf };
