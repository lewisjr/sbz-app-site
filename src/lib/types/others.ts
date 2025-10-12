import { queryTypesArray, referralSourcesArray, platformsArray } from "$lib/utils";
import type { Database as SBZdb } from "./db.types";

type ReferralSource = (typeof referralSourcesArray)[number];

type QueryTypes = (typeof queryTypesArray)[number];

type Platforms = (typeof platformsArray)[number];

type ActionConfig = "reassign" | "audit" | "chat" | "close";

type StaffActionConfig = "block" | "unblock" | "edit" | "perms" | "new";

export interface Types {
	/**For tickets */
	ReferralSource: ReferralSource;
	QueryTypes: QueryTypes;
	Platforms: Platforms;
	/**Fot ticket actions */
	ActionConfig: ActionConfig;
	/**Fot staff actions */
	StaffActionConfig: StaffActionConfig;
}

export interface GenericResponse {
	success: boolean;
	message: string;
}

export interface GenericResponseWData<T> extends GenericResponse {
	data: T;
}

export interface TicketRowLean {
	assigned: string;
	close_date: string | null;
	created_at: string;
	email: string;
	id: string;
	id_num: string;
	is_closed: boolean;
	luse_id: number;
	names: string;
	phone: string;
	platform: string;
	query: string;
	query_type: string;
	referral_source: string;
	closed_by: string | null;
	email_vars: string | null;
	assignee_email_vars: string | null;
	uid: string | null;
	close_reason: string | null;
}

export interface CloseTicketReturnObj {
	close_date: string;
	close_reason: string;
	closed_by: string;
	is_closed: boolean;
}

export type SettledTradeInsert = SBZdb["public"]["Tables"]["settled_trades"]["Insert"];
export interface SettleTradeUploadResponse {
	trades: SettledTradeInsert[];
	date: number;
	netVal: number;
	totalBuy: number;
	totalBuyClients: number;
	totalSell: number;
	totalSellClients: number;
}

export interface NewsLean {
	id: number;
	symbol: string;
	title: string;
	date: number;
	summary: string;
	analyst: string;
}
