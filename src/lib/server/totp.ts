import * as qrcode from "qrcode";
import Tokenise from "./tokenise";
import dbs from "./db";

import { Totp } from "time2fa";
import { randomBytes } from "crypto";

import type { Types } from "$lib/types";

import { TOTP_ISSUER } from "$env/static/private";

/**
 * Generate backup codes for a signature
 * @param count number of codes, defaults to 10
 * @returns a string[] of encoded backup codes
 */
const _genBackups = (count: number = 8): { encoded: string[]; raw: string[] } => {
	const raw: string[] = [];
	const encoded: string[] = [];

	const tokenise = new Tokenise();

	for (let i = 0; i < count; i++) {
		const code = randomBytes(4)
			.toString("hex")
			.toUpperCase() // hex gives 8-char code
			.replace(/(.{4})/, "$1-"); // format XXXX-XXXX

		raw.push(code);
		encoded.push(tokenise.encode(code));
	}
	return { encoded, raw };
};

const _genSignature = async (uid: any): Promise<Types["GenQrReturn"]> => {
	const user = `${uid}`;

	const val = Totp.generateKey({ issuer: TOTP_ISSUER, user });

	const tokenise = new Tokenise();

	try {
		const encoded = tokenise.encode(val.secret);
		const qr = await qrcode.toDataURL(val.url, { scale: 10 });

		return {
			data: {
				qr,
				encoded,
				raw: val.secret,
				backups: _genBackups(),
				key: uid,
			},
			message: "Secure signature generated!",
			success: true,
		};
	} catch (ex) {
		await dbs.sbz.log({ message: String(ex), title: "Gen Signature Exception" });

		return {
			data: {
				qr: "",
				encoded: "",
				raw: "",
				backups: {
					encoded: [],
					raw: [],
				},
				key: "",
			},
			message: "Failed to generate signature, please try again in a few minutes.",
			success: false,
		};
	}
};

const _checkSignature = (args: { val: string; secret: string }): boolean => {
	const { secret, val } = args;

	const tokenise = new Tokenise();
	const decoded = tokenise.decode(secret);

	return Totp.validate({ passcode: val, secret: decoded });
};

const _confirmBackups = async (luseId: number, idNum: string, value: string): Promise<boolean> => {
	const tokenise = new Tokenise();

	try {
		const client = await dbs.sbz.getClient(luseId);

		if (!client.length || !client[0] || !client[0].signatures) {
			await dbs.sbz.log({
				message: `Failed to get client '${luseId} from the db.`,
				title: "Use Backup E1",
			});
			return false;
		}

		// @ts-ignore
		const backups: Types["ClientSignature"] = client[0].signatures.backups;

		const rawBackups = backups.backups[idNum].map((v) => tokenise.decode(v));

		const backupExists = rawBackups.find((item) => item === value);

		if (!backupExists) {
			await dbs.sbz.log({
				message: `Failed to validate '${luseId}'s code from their backups list.`,
				title: "Use Backup E2",
			});
			return false;
		}

		const i = rawBackups.indexOf(backupExists);

		backups.backups[idNum].splice(i, 1);

		const res = await dbs.sbz.updateClient(
			{ signatures: { value: backups.value, backups: backups.backups } },
			luseId,
			idNum,
			true,
		);

		if (!res.success) {
			return false;
		}

		return true;
	} catch (ex: any) {
		await dbs.sbz.log({ message: String(ex), title: "Use Backup Exception" });
		return false;
	}
};

const totp = {
	/**
	 * generate a custom client signature
	 */
	gen: _genSignature,
	/**
	 * validate the client's signature; Note that the signature provided should be encrypted.
	 */
	validate: _checkSignature,
	/**
	 * use one of the backup codes to regain access to your account
	 */
	useBackup: _confirmBackups,
};

export default totp;
