import util from "util";
import { customAlphabet } from "nanoid";

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
	const month = date.toLocaleString(undefined, { month: "long" });
	const year = date.getFullYear();

	let hours = date.getHours();
	const minutes = date.getMinutes().toString().padStart(2, "0");

	// Handle 24:xx formatting manually
	if (hours === 0) {
		hours = 24; // interpret midnight as 24:00 of previous day
	}

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
