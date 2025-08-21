import postmark from "postmark";
import templates from "./templates";
import dbs from "$lib/server/db";

import type { GenericEmailObj, OtpEmailObj, ButtonEmailObj } from "./templates";

import { POSTMARK_CLIENT } from "$env/static/private";

var client = new postmark.ServerClient(POSTMARK_CLIENT);

const sendOtp = async (
	{ otp, subject, title }: OtpEmailObj,
	recipient: string,
): Promise<boolean> => {
	const { html, plain } = templates.otp({ title, otp, subject });

	try {
		const res = await client.sendEmail({
			From: "app@sbz.com.zm",
			To: recipient,
			Subject: subject,
			HtmlBody: html,
			TextBody: plain,
			MessageStream: "outbound",
		});

		if (res.ErrorCode) {
			await dbs.sbz.log({
				title: "Send OTP Error: Email",
				msg: `Failed to send OTP: ${otp} to ${recipient}. Code ${res.ErrorCode}`,
			});
			return false;
		} else return true;
	} catch (ex: any) {
		const error =
			typeof ex === "string"
				? ex
				: ex instanceof Error
					? ex.message
					: ex.message || JSON.stringify(ex);
		await dbs.sbz.log({ title: "Send OTP Exception: Email", msg: error });
		return false;
	}
};

const sendUpdate = async (
	{ subject, title, body, extra }: GenericEmailObj,
	recipient: string,
): Promise<boolean> => {
	const { html, plain } = templates.generic({ title, body, extra, subject });

	try {
		const res = await client.sendEmail({
			From: "app@sbz.com.zm",
			To: recipient,
			Subject: subject,
			HtmlBody: html,
			TextBody: plain,
			MessageStream: "outbound",
		});

		if (res.ErrorCode) {
			await dbs.sbz.log({
				title: "Send Generic Error: Email",
				msg: `Failed to send email to ${recipient}. Code ${res.ErrorCode}`,
			});
			return false;
		} else return true;
	} catch (ex: any) {
		const error =
			typeof ex === "string"
				? ex
				: ex instanceof Error
					? ex.message
					: ex.message || JSON.stringify(ex);
		await dbs.sbz.log({ title: "Send Generic Exception: Email", msg: error });
		return false;
	}
};

const sendLink = async (
	{ subject, title, body, extra, link, linkText }: ButtonEmailObj,
	recipient: string,
): Promise<boolean> => {
	const { html, plain } = templates.button({ title, body, extra, subject, link, linkText });

	try {
		const res = await client.sendEmail({
			From: "app@sbz.com.zm",
			To: recipient,
			Subject: subject,
			HtmlBody: html,
			TextBody: plain,
			MessageStream: "outbound",
		});

		if (res.ErrorCode) {
			await dbs.sbz.log({
				title: "Send Link Error: Email",
				msg: `Failed to send email to ${recipient}. Code ${res.ErrorCode}`,
			});
			return false;
		} else return true;
	} catch (ex: any) {
		const error =
			typeof ex === "string"
				? ex
				: ex instanceof Error
					? ex.message
					: ex.message || JSON.stringify(ex);
		await dbs.sbz.log({ title: "Send Link Exception: Email", msg: error });
		return false;
	}
};

export const email = {
	sendOtp,
	sendUpdate,
	sendLink,
};
