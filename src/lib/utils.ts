import util from "util";
import { customAlphabet } from "nanoid";
import { numParse, parseDate } from "@cerebrusinc/qol";

import type { DateObject } from "@cerebrusinc/qol";
import { toTitleCase } from "@cerebrusinc/fstring";

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

/**Deep console logging, for any debugging */
export const devLog = (arg: any, location: string) => {
	console.log(arg, { location, timestamp: genDbTimestamp() });
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
	"QT:Order",
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

// ? Start Week Engines

interface GenericDataWDate {
	date: number;
	[key: string]: any;
}

/**For responsive pickers, get the list of dates so you can mutate the other dates. It removes repeat values, and sorts in descending order. */
const getPickerDates = (data: GenericDataWDate[]): number[] => {
	const datesRaw = data.map((item) => item.date);

	const datesClean: number[] = [];

	datesRaw.forEach((date) => {
		if (!datesClean.includes(date)) {
			datesClean.push(date);
		}
	});

	datesClean.sort((a, b) => (b > a ? 1 : -1));

	return datesClean;
};

/**
 * From a list of dates, get the nth week in the past for work days from a provided list of dates from structured data.
 * @param dateList you can provide your own dates as a `number[]` with format `YYYYMMDD`, but if not provided, it'll use your raw data to convert that on it's own
 * @param dateF this is the final date that you want the engine to base it's calculation on
 * @param eow this is `true` by default. It modifies whether you want the same or close date within nth week
 * @param history the nth week, it defaults to 1
 * @returns a `number` in the format `YYYYMMDD` for the correct date. **By default** this date will be the end of the last week and not the same day. If you want the same day or the closest day to it last week (e.g if it is a holiday) it will first look backwards within the same week and if not then look ahead in the same week (e.g Wed is a holiday but Thurs and Fri aren't) until it finds a date.
 */
const pastWeekEngine = (
	dateList: GenericDataWDate[] | number[],
	dateF?: number,
	eow: boolean = true,
	history: number = 1,
): number => {
	const dates =
		typeof dateList[0] === "number"
			? (dateList as number[])
			: getPickerDates(dateList as GenericDataWDate[]);

	// descending order
	dates.sort((a, b) => (b > a ? 1 : -1));

	/**Final date */
	const df = dateF ? dateF : dates[0];

	const dfStr = df.toString();
	const yf = Number(dfStr.substring(0, 4));
	const mf = Number(dfStr.substring(4, 6));
	const Dfin = Number(dfStr.substring(6, 8));

	const jsDf = new Date(`${yf}-${mf}-${Dfin}`);

	// parsed date final
	const pdF = parseDate(Dfin, jsDf.getDay(), mf - 1, yf) as DateObject;

	const dfEnglish = pdF.day.long;

	// console.log({ pdF, df, dfEnglish });

	/**last week date */
	let di = -1;

	let weekCount: number = 0;
	let prevWeekDay: number = pdF.day.weekNumber;

	/**For when there is no preceeding day, keep the days after dn (if any) to provide after day calculations */
	const forwardsArr: number[] = [];

	dates.forEach((dn, i) => {
		const dnStr = dn.toString();
		const yn = Number(dnStr.substring(0, 4));
		const mn = Number(dnStr.substring(4, 6));
		const Dnin = Number(dnStr.substring(6, 8));

		const jsDn = new Date(`${yn}-${mn}-${Dnin}`);

		// parsed date final
		const pdN = parseDate(Dnin, jsDn.getDay(), mn - 1, yn) as DateObject;

		const dnEnglish = pdN.day.long;

		if (i) {
			if (pdN.day.weekNumber > prevWeekDay) {
				weekCount++;
			}
		}

		// console.log({ pdN, dn, dnEnglish, i, weekCount, prevWeekDay, history });

		prevWeekDay = pdN.day.weekNumber;

		switch (eow) {
			case true:
				if (di === -1 && weekCount === history) {
					di = dn;
				}
				break;
			default:
				// store the proceeding days and sort in ascending order
				if (di === -1 && weekCount === history && pdN.day.weekNumber > pdF.day.weekNumber) {
					forwardsArr.push(dn);
					forwardsArr.sort((a, b) => (a > b ? 1 : -1));
				}

				// look backwards first, from the day of to the days prior
				if (di === -1 && weekCount === history && pdN.day.weekNumber <= pdF.day.weekNumber) {
					di = dn;
				}

				// look forwards if there was nothing backwards
				if (di === -1 && weekCount > 0 && weekCount !== history && forwardsArr.length) {
					di = forwardsArr[0];
				}
				break;
		}
	});

	// if no day can be found
	if (di === -1) {
		di = df;
	}

	// console.log({ di, df });

	return di;
};

/**A suite of software that does human speech calculations for past/future dates. */
export const workDayEngines = {
	/**
	 * From a list of dates, get the nth week in the past for work days from a provided list of dates from structured data.
	 * @param dateList you can provide your own dates as a `number[]` with format `YYYYMMDD`, but if not provided, it'll use your raw data to convert that on it's own
	 * @param dateF this is the final date that you want the engine to base it's calculation on
	 * @param eow this is `true` by default. It modifies whether you want the same or close date within nth week
	 * @param history the nth week, it defaults to 1
	 * @returns a `number` in the format `YYYYMMDD` for the correct date. **By default** this date will be the end of the last week and not the same day. If you want the same day or the closest day to it last week (e.g if it is a holiday) it will first look backwards within the same week and if not then look ahead in the same week (e.g Wed is a holiday but Thurs and Fri aren't) until it finds a date.
	 */
	pastWeek: pastWeekEngine,
};

export const dmbKeysCodex = {
	ask: "Ask",
	ask_vol: "Ask Volume",
	bid: "Bid",
	bid_vol: "Bid Volume",
	// date: number,
	delta: "% Change",
	delta_abs: "Change",
	div_yield: "Dividend Yield",
	issued_shares: "Issued Shares",
	market_price: "Price",
	pbv: "Price-to-Book",
	pe: "Price-to-Earnings",
	// symbol: string,
	traded_vol: "Volume",
	trail_52_high: "52 Week High",
	trail_52_low: "52 Week Low",
	turnover: "Turnover",
	ytd: "Year to Date",
	market_cap: "Market Cap",
};

/**Converts the date from DDMMYYYY to YYYY-MM-DD */
export const dateTimeifier = (_date: number | string): string => {
	try {
		const date = _date.toString();
		const y = Number(date.substring(0, 4));
		const m = Number(date.substring(4, 6));
		const D = Number(date.substring(6, 8));

		return `${y}-${m}-${D}`;
	} catch (ex) {
		return "N/A";
	}
};

/**Default size is `20` */
export const chunkArray = <T>(arr: T[], size: number = 20) => {
	const result = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
};

export const systemPermissions = [
	"reassign-ticket",
	"audit-ticket",
	"edit-staff",
	"block-staff",
	"close-ticket",
	"add-staff",
];

export const fileNamifier = (link: string): string => {
	const nameArr = link.split("/");
	const name = nameArr[nameArr.length - 1];
	const extensionArr = link.split(".");
	const extension = extensionArr[extensionArr.length - 1];

	// console.log({ extension, extensionArr });

	if (link.includes("sbz.com.zm")) return toTitleCase(name.replaceAll("-", " "));
	else return `${name.substring(0, 10)}...${extension}`;
};

/**For custom file uploads */
export const sanitizeFname = (n: string): string => {
	return n.replaceAll("[", "").replaceAll("]", "");
};
