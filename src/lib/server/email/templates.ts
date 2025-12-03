import { genTimestamp } from "$lib/utils";

interface TemplateResponse {
	html: string;
	plain: string;
}

interface EmailObj {
	title: string;
	subject: string;
	cc?: string;
}

export interface GenericEmailObj extends EmailObj {
	body: string;
	extra: string;
}

const logoUri: string =
	"https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/sbz/no%20alpha%20sbz%20logo.png";

const generic = ({ title, body, extra }: GenericEmailObj): TemplateResponse => {
	const timestamp = genTimestamp();

	const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><!--[if mso]><style type="text/css">body, table, td, a {font-family: Arial, Helvetica, sans-serif !important;}</style><![endif]--></head><body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;"><table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);"><tbody><tr><td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;"><table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;"><tbody><tr><td style="padding: 40px 0px 0px;"><div style="text-align: left;"><div style="padding-bottom: 20px;"><img src="${logoUri}" alt="SBZ Logo" style="width: 56px;height: 56px;" width="56" height="56" title="SBZ Logo"></div></div><div style="padding: 20px; background-color: rgb(255, 255, 255);"><div style="color: rgb(0, 0, 0); text-align: left;"><h1 style="margin: 1rem 0">${title}</h1><p style="padding-bottom: 16px">${body}</p><p style="padding-bottom: 16px">${extra}</p><p style="padding-bottom: 16px">Thanks,<br>Stockbrokers Zambia</p></div></div><div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;"><p style="padding-bottom: 16px">Built by <a href="https://www.neos.finance" target="__blank" style="color: rgba(228, 68, 39, 0.979)">Neos FinTech</a><br />Sent from SBZ Digital<br />${timestamp}</p></div></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

	const plain = `${title}\n\n${body}\n${extra}\n\nThanks,\nStockbrokers Zambia\n\nSent from SBZ Digital\n${timestamp}`;

	return { html, plain };
};

export interface OtpEmailObj extends EmailObj {
	otp: number;
}

const otp = ({ title, subject, otp }: OtpEmailObj): TemplateResponse => {
	const timestamp = genTimestamp();

	const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><!--[if mso]><style type="text/css">body, table, td, a {font-family: Arial, Helvetica, sans-serif !important;}</style><![endif]--></head><body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;"><table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);"><tbody><tr><td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;"><table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;"><tbody><tr><td style="padding: 40px 0px 0px;"><div style="text-align: left;"><div style="padding-bottom: 20px;"><img src="${logoUri}" alt="SBZ Logo" style="width: 56px;height: 56px;" width="56" height="56" title="SBZ Logo"></div></div><div style="padding: 20px; background-color: rgb(255, 255, 255);"><div style="color: rgb(0, 0, 0); text-align: left;"><h1 style="margin: 1rem 0">${subject}</h1><p style="padding-bottom: 16px">Your SBZ Digital OTP is <strong>${otp}</strong></p><p style="padding-bottom: 16px">Do not share this number with anyone.</p><p style="padding-bottom: 16px">Thanks,<br>Stocbrokers Zambia</p></div></div><div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;"><p style="padding-bottom: 16px">Built by <a href="https://www.neos.finance" target="__blank" style="color: rgba(228, 68, 39, 0.979)">Neos FinTech</a><br />Sent from SBZ Digital<br />${timestamp}</p></div></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

	const plain = `${subject}\n\nYour SBZ Digital OTP is ${otp}\nDo not share this number with anyone.\n\nThanks,\nStocbrokers Zambia\n\nSent from SBZ Digital\n${timestamp}`;

	return { html, plain };
};

export interface ButtonEmailObj extends EmailObj {
	body: string;
	extra: string;
	link: string;
	linkText: string;
}

export const button = ({
	body,
	extra,
	link,
	linkText,
	subject,
	title,
}: ButtonEmailObj): TemplateResponse => {
	const timestamp = genTimestamp();

	const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]--></head><body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;"><table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);"><tbody><tr><td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;"><table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;"><tbody><tr><td style="padding: 40px 0px 0px;"><div style="text-align: left;"><div style="padding-bottom: 20px;"><img src="${logoUri}" alt="SBZ Logo" style="width: 56px;height: 56px;" width="56" height="56" title="SBZ Logo"></div></div><div style="padding: 20px; background-color: rgb(255, 255, 255);"><div style="color: rgb(0, 0, 0); text-align: left;"><h1 style="margin: 1rem 0">${title}</h1><p style="padding-bottom: 16px">${body}</p><p style="padding-bottom: 16px"><a href="${link}" target="__blank" style="padding: 12px 24px; border-radius: 4px; color: #FFF; background: #34a853;display: inline-block;margin: 0.5rem 0;">${linkText}</a></p><p style="padding-bottom: 16px">${extra}</p><p style="padding-bottom: 16px">Thanks,<br>Stockbrokers Zambia</p></div></div><div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;"><p style="padding-bottom: 16px">Built by <a href="https://www.neos.finance" target="__blank" style="color: rgba(228, 68, 39, 0.979)">Neos Finance</a><br />Sent from SBZ Digital<br />${timestamp}</p></div></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

	const plain = `${subject}\n\n${body}\n${extra}\n\nThanks,\nStockbrokers Zambia\n\nSent from SBZ Digital\n${timestamp}`;

	return { html, plain };
};

const templates = {
	/**For any random email */
	generic,
	/**Specifically for OTPs */
	otp,
	/**For redirect links */
	button,
};

export default templates;
