import { queryTypesArray, referralSourcesArray, platformsArray } from "$lib/utils";
import type { Database as SBZdb } from "./db.types";

type ReferralSource = (typeof referralSourcesArray)[number];

type QueryTypes = (typeof queryTypesArray)[number];

type Platforms = (typeof platformsArray)[number];

type ActionConfig = "reassign" | "audit" | "chat";

export interface Types {
	/**For tickets */
	ReferralSource: ReferralSource;
	QueryTypes: QueryTypes;
	Platforms: Platforms;
	/**Fot ticket actions */
	ActionConfig: ActionConfig;
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
	uid: string | null;
}
