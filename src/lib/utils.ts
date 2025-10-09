import util from "util";
import { customAlphabet } from "nanoid";
import { numParse, parseDate } from "@cerebrusinc/qol";

/**6 digit otp */
export const genOTP = (): number => {
	return Math.floor(100000 + Math.random() * 900000);
};

export const genDbTimestamp = (): string => {
	return new Date().toISOString();
};

/**In UTC +2 for emails and other notifications*/
export const genTimestamp = () => {
	const date = new Date();
	const formatter = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Etc/GMT-2", // GMT+2 (note: this is inverted in Etc format)
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(date);

	const day = parts.find((p) => p.type === "day")?.value ?? "";
	const month = parts.find((p) => p.type === "month")?.value ?? "";
	const year = parts.find((p) => p.type === "year")?.value ?? "";
	const hour = parts.find((p) => p.type === "hour")?.value ?? "";
	const minute = parts.find((p) => p.type === "minute")?.value ?? "";

	return `${day} ${month} ${year}, ${hour}:${minute}`;
};

/**Deep console logging, for objets mainly */
export const print = (arg: any) => {
	console.log(util.inspect(arg, false, null, true));
};

/**Convert supabase timestamp to human readable */
export const formatDbTime = (isoString: string) => {
	const date = new Date(isoString);

	// Get local parts
	const day = date.getDate();
	const month = date.toLocaleString(undefined, { month: "short" });
	const year = date.getFullYear();

	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	/*
	// Handle 24:xx formatting manually
	if (hours === 0) {
		hours = 24; // interpret midnight as 24:00 of previous day
	}
	*/

	return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

/**Generating tickets, and other indexing items */
export const genId = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", 11);

/**Simple random AB testing; Not truly random */
export const randomAb = <T>(arr: T[]): T | null => {
	if (arr.length === 0) return null;
	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
};

/**Convert decimal percentages to percentage values with the "%" */
export const percentageHandler = (_value: number): string => {
	return (_value * 100).toFixed(2) + "%";
};

export const referralSourcesArray = [
	"RS:Web",
	"RS:Facebook",
	"RS:YouTube",
	"RS:LinkedIn",
	"RS:Spotify",
	"RS:LuSE",
	"RS:ZBT",
	"RS:Ventura",
	"RS:Radio Phoenix",
	"RS:Referral",
	"RS:News",
	"RS:Newspaper",
	//"RS:Other",
] as const;

export const queryTypesArray = [
	"QT:Account Opening",
	"QT:Trade Status",
	"QT:Compliment",
	"QT:Complaint",
	"QT:Portfolio",
	"QT:Contract Note",
	"QT:Other",
] as const;

export const platformsArray = ["P:Web", "P:Messenger", "P:Whatsapp", "P:Email"] as const;

/**Generate today's date in the following format YYYYMMDD in utc */
export const genDate = (): number => {
	const d = new Date();

	const y = d.getUTCFullYear();
	const _m = d.getUTCMonth() + 1;
	const m = _m > 9 ? _m.toString() : `0${_m}`;
	const _D = d.getUTCDate();
	const D = _D > 9 ? _D.toString() : `0${_D}`;

	return Number(`${y}${m}${D}`);
};

/**Using a date in formation YYYYMMDD do some complicated date mathematics */
export const getOldDate = (d: number, diff: number) => {
	const dateStr = d.toString();
	// Extract year, month, and day from the input string
	const year = parseInt(dateStr.substring(0, 4), 10);
	const month = parseInt(dateStr.substring(4, 6), 10) - 1; // Months are 0-based
	const day = parseInt(dateStr.substring(6, 8), 10);

	// Create a Date object for the given date
	const date = new Date(year, month, day);

	// Subtract 30 days
	date.setDate(date.getDate() - diff);

	// Extract the new year, month, and day
	const newYear = date.getFullYear();
	const newMonth = String(date.getMonth() + 1).padStart(2, "0"); // Months are 1-based for formatting
	const newDay = String(date.getDate()).padStart(2, "0");

	// Format the new date as YYYYMMDD
	return Number(`${newYear}${newMonth}${newDay}`);
};

/**Minify numbers to include the "k", "M", "B", and "T" */
export const mrMateNumMinifier = (_value: number, decimals?: boolean): string => {
	const array: string[] = [];
	const isNegative = _value < 0 ? true : false;
	const [value, dec] = isNegative
		? (_value * -1).toString().split(".")
		: _value.toString().split(".");
	//decimal count
	let x = decimals ? 2 : 0;

	// values between 1,000,000,000,000 and 999,999,999,999,999 | trillions
	if (value.length > 12) {
		const tempVal = numParse(value, "comma");
		const splitTemp = tempVal.split(",");
		const decVal =
			splitTemp[1][0] === "0" && splitTemp[1][1] === "0"
				? ""
				: `.${splitTemp[1][0]}${Number(splitTemp[1][2]) > 4 ? Number(splitTemp[1][1]) + 1 : Number(splitTemp[1][1])}`;
		return `${isNegative ? "-" : ""}${splitTemp[0]}${decVal}T`;
	}

	// values between 1,000,000,000 and 999,999,999,999 | billions
	if (value.length > 9) {
		const tempVal = numParse(value, "comma");
		const splitTemp = tempVal.split(",");
		const decVal =
			splitTemp[1][0] === "0" && splitTemp[1][1] === "0"
				? ""
				: `.${splitTemp[1][0]}${Number(splitTemp[1][2]) > 4 ? Number(splitTemp[1][1]) + 1 : Number(splitTemp[1][1])}`;
		return `${isNegative ? "-" : ""}${splitTemp[0]}${decVal}B`;
	}

	// values between 1,000,000 and 999,999,999 | millions
	if (value.length > 6) {
		const tempVal = numParse(value, "comma");
		const splitTemp = tempVal.split(",");
		const decVal =
			splitTemp[1][0] === "0" && splitTemp[1][1] === "0"
				? ""
				: `.${splitTemp[1][0]}${Number(splitTemp[1][2]) > 4 ? Number(splitTemp[1][1]) + 1 : Number(splitTemp[1][1])}`;
		return `${isNegative ? "-" : ""}${splitTemp[0]}${decVal}M`;
	}

	// in case decimals are allowed but the decimals are zero, make the decimal parameter 0
	if (Number(_value.toFixed(2).split(".")[1]) === 0) x = 0;

	return numParse(_value.toFixed(x), "comma");
};

/**Mr Mate requested symbol parity */
export const mrMateSymbols = (value: string, fullReiz?: boolean): string => {
	let codex: { [key: string]: string } = {
		ZCCM: "ZCCM-IH",
		ZNCO: "ZANACO",
		ZMFA: "ZAMEFA",
		ZABR: "ZAMBREW",
		ZMRE: "ZAMBIA RE",
		ZMBF: "ZAMBEEF",
		ZFCO: "ZAFFICO",
		SHOP: "SHOPRITE",
		REIZ: "REAL ESTATE",
		REIZUSD: "REAL ESTATE USD",
		PMDZ: "PAMODZI",
		NATB: "NATBREW",
		MAFS: "MADISON",
		CHIL: "CHILANGA",
		CECZ: "CEC",
	};

	if (!fullReiz)
		codex = {
			ZCCM: "ZCCM-IH",
			ZNCO: "ZANACO",
			ZMFA: "ZAMEFA",
			ZABR: "ZAMBREW",
			ZMRE: "ZAMBIA RE",
			ZMBF: "ZAMBEEF",
			ZFCO: "ZAFFICO",
			SHOP: "SHOPRITE",
			REIZ: "REAL ESTATE",
			PMDZ: "PAMODZI",
			NATB: "NATBREW",
			MAFS: "MADISON",
			CHIL: "CHILANGA",
			CECZ: "CEC",
		};

	if (codex[value]) return codex[value];
	else return value;
};

/**Simple helper to change a negative number from normal to accounting format (e.g -1.036 to (1.04)) */
export const negativesHandler = (value: number): string => {
	if (value < 0) return `(${(value * -1).toFixed(2)})`;
	else return value.toFixed(2);
};

/**Get a date as YYYYMMDD and change it to DD month YYYY */
export const prettyDate = (_date: number | string): string => {
	try {
		const date = _date.toString();
		const y = Number(date.substring(0, 4));
		const m = Number(date.substring(4, 6));
		const D = Number(date.substring(6, 8));

		const pd = parseDate(D, 0, m - 1, y, "nsl");

		if (typeof pd === "object") return "...";

		return pd;
	} catch (ex) {
		return "N/A";
	}
};

export const logos = {
	sbz: "https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/sbz/no%20alpha%20sbz%20logo.png",
	neos: "https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/neos/logo_full.png",
	vantum:
		"https://gufnvlwdovkffgmwutgr.supabase.co/storage/v1/object/public/engine-constants/vantum/vantum%20logo%20no%20alpha.png",
};

export const contactDetails = {
	address: "36 Mwapona Road, Woodlands, Lusaka, Zambia",
	tel: "+260 212 225984 / +260 211 232456",
	email: "info@sbz.com.zm",
};
