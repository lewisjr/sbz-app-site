import { nfdb, sbzdb } from "./db";
import { genDbTimestamp } from "$lib/utils";

// * SBZ DB functions
interface GenericResponse {
	success: boolean;
	msg: string;
}

interface LogObj {
	title: string;
	msg: string;
}

interface OTPObj {
	user: string;
	otp: number;
}

interface SBZutils {
	log: (obj: LogObj) => Promise<void>;
	setOtp: (obj: OTPObj) => Promise<GenericResponse>;
	checkOtp: (obj: OTPObj) => Promise<GenericResponse>;
}

const sbz = (): SBZutils => {
	const _log = async (obj: LogObj): Promise<void> => {
		try {
			const {} = await sbzdb.from("logs").insert({ title: obj.title, value: obj.msg });
			console.log(`\n${obj.title} ==> ${obj.msg}`);
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
				await _log({ msg: error.message, title: "Set OTP Error" });
				return {
					msg: "Failed to generate your OTP, please wait a few minutes and try again.",
					success: false,
				};
			}

			return { msg: "Please check your Whatsapp or email for the OTP.", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ msg: error, title: "Set OTP Exception" });
			return { success: false, msg: "Server error, please wait 10 minutes and try again." };
		}
	};

	const _checkOtp = async (obj: OTPObj): Promise<GenericResponse> => {
		try {
			const { data, error } = await sbzdb.from("otps").select("otp").filter("id", "eq", obj.user);

			if (error) {
				await _log({ msg: error.message, title: "Check OTP Error" });
				return {
					msg: "Failed to get your OTP, please wait a few minutes and try again.",
					success: false,
				};
			}

			if (data[0].otp !== obj.otp) return { msg: "Incorrect value entered!", success: false };
			else return { msg: "Redirecting...", success: true };
		} catch (ex: any) {
			const error =
				typeof ex === "string"
					? ex
					: ex instanceof Error
						? ex.message
						: ex.message || JSON.stringify(ex);

			_log({ msg: error, title: "Check OTP Exception" });
			return { success: false, msg: "Critical error, please try again in 5 minutes." };
		}
	};

	return {
		log: _log,
		setOtp: _setOtp,
		checkOtp: _checkOtp,
	};
};

// ? NeuroFlow DB functions
interface NFutils {}

const nf = (): NFutils => {
	return {};
};

// end

export { sbz, nf };
