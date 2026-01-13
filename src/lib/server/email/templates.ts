import { genTimestamp, mrMateSymbols, print } from "$lib/utils";

import type { PortfolioStandards } from "$lib/types";
import { numParse } from "@cerebrusinc/qol";

interface TemplateResponse {
	html: string;
	plain: string;
}

interface EmailObj {
	title: string;
	subject: string;
	cc?: string;
	bcc?: string;
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

export interface PortfolioEmailObj extends EmailObj {
	folio: PortfolioStandards["ClientTradeHistory"];
	macroAnalysis: PortfolioStandards["PortfolioMacroAnalysis"];
	year: number;
	usd: { sell: number; buy: number };
	luseId: number;
	fname: string;
}

export const portfolio = ({
	folio,
	macroAnalysis,
	year,
	usd,
	luseId,
	fname,
}: PortfolioEmailObj): TemplateResponse => {
	const tx = genTimestamp();

	const link = "https://app.sbz.com.zm/sign-in";
	const linkText = "Sign In";
	const extra = `Click the button above in order to sign in and interact with your account! Your LuSE ID is <span class="num">${luseId}</span>.`;

	const title = `YTD ${year} Portfolio Valuation`;

	print({ sum: macroAnalysis.ytd.summary });

	let body = `Hi ${fname}!<br /><br />`;

	macroAnalysis.ytd.summary.forEach((txt) => {
		if (txt.substring(0, 2) === "--") {
			const [_, clss, val] = txt.split("--");
			body += `<span class="${clss}">${val}</span>`;
		} else if (txt.substring(0, 2) === "==") {
			const [_, clss, val] = txt.split("==");
			body += `<span class="${clss}">${val}</span>`;
		} else body += txt;
	});

	const _genFolioTable = (rows: PortfolioStandards["Portfolio"][]): string => {
		return rows
			.map((row, i) => {
				if (i % 2 !== 0)
					return `<tr><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${mrMateSymbols(row.symbol)}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.price.toFixed(2))}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.volume)}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.value.toFixed(2))}</td></tr>`;
				return `<tr style="background-color:#F9F9F9;"><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${mrMateSymbols(row.symbol)}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.price.toFixed(2))}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.volume)}</td><td width="25%" style="vertical-align: top; padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;white-space: nowrap;">${numParse(row.value.toFixed(2))}</td></tr>`;
			})
			.join("");
	};

	const html = `<html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]--><style type="text/css">.num { font-family: "Google Sans Code", monospace; } .gren { color: #34a853; } .rd { color: #ea4335; } .font-bold { font-weight: bold; } .italic { font-style: italic; } .underline { text-decoration: underline; } .line-through { text-decoration: line-through; } .folio { table-layout: auto !important; width: fit-content !important; } .folio td { padding-left: 10px !important; padding-right: 10px !important; width: fit-content !important; } .folio th { width: fit-content !important; }</style></head><body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;"><table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);"><tbody><tr><td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;"><table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;"><tbody><tr><td style="padding: 40px 0px 0px;"><div style="text-align: left;"><div style="padding-bottom: 20px;"><img src="${logoUri}" alt="SBZ Logo" style="width: 56px;height: 56px;" width="56" height="56" title="SBZ Logo"></div></div><div style="padding: 20px; background-color: rgb(255, 255, 255);"><div style="color: rgb(0, 0, 0); text-align: left;"><h1 style="margin: 1rem 0">${title}</h1><p style="padding-bottom: 16px">${body}</p>${
		!folio.portfolioZmw.length
			? ""
			: `<table class="folio" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse;width: fit-content;max-width: 100%; table-layout: fixed; direction: ltr; background-color: transparent; font-family: 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif; font-weight: 400; color: #000000; text-align: center; letter-spacing: 0px;" width="100%"><thead style="vertical-align: top; background-color: #EAEAEA; color: #505659; font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px;"><tr><th colspan="4" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;">Kwacha Holdings: K ${numParse(folio.portfolioTotalZmw.toFixed(2))} | $ ${numParse((folio.portfolioTotalZmw / usd.sell).toFixed(2))}</th></tr><tr><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Symbol</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Price</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Volume</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Total</strong></th></tr></thead><tbody style="vertical-align: top; font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px;">${_genFolioTable(folio.portfolioZmw[0])}</tbody></table>`
	}${
		!folio.portfolioUsd.length
			? ""
			: `<table class="folio" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse;width: fit-content;max-width: 100%; table-layout: fixed; direction: ltr; background-color: transparent; font-family: 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif; font-weight: 400; color: #000000; text-align: center; letter-spacing: 0px;margin-top: 30px;" width="100%"><thead style="vertical-align: top; background-color: #EAEAEA; color: #505659; font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px;"><tr><th colspan="4" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;">USD Holdings: K ${numParse((folio.portfolioTotalUsd * usd.buy).toFixed(2))} | $ ${numParse(folio.portfolioTotalUsd.toFixed(2))}</th></tr><tr><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Symbol</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Price</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Volume</strong></th><th width="25%" style="padding: 10px; word-break: break-word; font-weight: 400; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;"><strong>Total</strong></th></tr></thead><tbody style="vertical-align: top; font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px;">${_genFolioTable(folio.portfolioUsd[0])}</tbody></table>`
	}<p style="padding-bottom: 16px"><a href="${link}" target="__blank" style="padding: 12px 24px; border-radius: 4px; color: #FFF; background: #34a853;display: inline-block;margin: 0.5rem 0;">${linkText}</a></p><p style="padding-bottom: 16px">${extra}</p><p style="padding-bottom: 16px">Thanks,<br>Stockbrokers Zambia</p></div></div><div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;"><p style="padding-bottom: 16px">Built by <a href="https://www.neos.finance" target="__blank" style="color: rgba(228, 68, 39, 0.979)">Neos Finance</a><br>Sent from SBZ Digital<br>${tx}</p></div></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

	const plain = ``;

	return { html, plain };
};

const templates = {
	/**For any random email */
	generic,
	/**Specifically for OTPs */
	otp,
	/**For redirect links */
	button,
	/**For portfolio updates */
	portfolio,
};

export default templates;
