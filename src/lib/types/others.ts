import { queryTypesArray, referralSourcesArray, platformsArray } from "$lib/utils";
import type { Database as SBZdb } from "./db.types";
import type { Database as NFdb } from "./nf.types";

type ReferralSource = (typeof referralSourcesArray)[number];

type QueryTypes = (typeof queryTypesArray)[number];

type Platforms = (typeof platformsArray)[number];

type ActionConfig = "reassign" | "audit" | "chat" | "close";

type StaffActionConfig = "block" | "unblock" | "edit" | "perms" | "new" | "on-leave" | "on-duty";

interface Folio {
	symbol: string;
	volume: number;
	value: number;
}

interface ClientKyc {
	title: string;
	url: string;
}

export interface PickerObj<T> {
	value: T;
	label: string;
}

export interface Types {
	/**For tickets */
	ReferralSource: ReferralSource;
	QueryTypes: QueryTypes;
	Platforms: Platforms;
	/**Fot ticket actions */
	ActionConfig: ActionConfig;
	/**Fot staff actions */
	StaffActionConfig: StaffActionConfig;
	AnyPickerObj: { label: string; value: any };
	Folio: Folio;
	ClientKyc: ClientKyc;
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

export type DmbRowKey =
	| "delta"
	| "delta_abs"
	| "market_price"
	| "traded_vol"
	| "turnover"
	| "market_cap";

export interface ExpandedSymbolReturn {
	fundamentals: NFdb["public"]["Tables"]["symbol-metrics"]["Row"][];
	balance: NFdb["public"]["Tables"]["balance-sheets"]["Row"][];
	income: NFdb["public"]["Tables"]["income-statements"]["Row"][];
	cashFlow: NFdb["public"]["Tables"]["cash-flow-statements"]["Row"][];
}

interface SimpleTrade {
	symbol: string;
	price: number;
	qty: number;
	total: number;
	side: string;
	date: string;
}

interface SimpleOrder {
	symbol: string;
	price: number;
	qty: number;
	total: number;
	side: string;
	date: string;
}

export interface NFHelp {
	StockData: NFdb["public"]["Tables"]["sbz-dmb"]["Row"];
	FxData: NFdb["public"]["Tables"]["fx"]["Row"];
	EconData: NFdb["public"]["Tables"]["economic-statistics"]["Row"];
	OpinionsData: NFdb["public"]["Tables"]["symbol-recommendations"]["Row"];
	DmbRowKey: DmbRowKey;
	ExpandedSymbolReturn: ExpandedSymbolReturn;
	SimpleTrade: SimpleTrade;
	SimpleOrder: SimpleOrder;
	MatchedTrade: NFdb["public"]["Tables"]["sbz-matched-trades"]["Row"];
	OnScreenOrder: NFdb["public"]["Tables"]["on-screen-orders"]["Row"];
}

export interface ExpandedSymbol {
	currency: string;
	mcap: {
		zmw: number;
		usd: number;
	};
	price: {
		price: number;
		change: number;
		percentageChange: number;
		ytd: number;
		trail52H: number;
		trail52L: number;
	};
	bidask: {
		bid: number;
		ask: number;
		bidVol: number;
		askVol: number;
	};
	trades: {
		vol: number;
		turn: number;
		turnUsd: number;
	};
	sentiment: {
		value: string;
		class: "gren" | "rd" | "orng" | "blu" | undefined;
	};
	profitability: {
		cfps: number;
		eps: number;
	};
	return: {
		roe: number;
		roa: number;
		roi: number;
	};
	margins: {
		gp: number;
		pbit: number;
		pbt: number;
		np: number;
		tax: number;
	};
	liquidity: {
		quick: number;
		current: number;
	};
	efficiency: {
		acp: number;
		app: number;
		assTurn: number;
	};
	intrinsic: {
		nav: number;
		pe: number;
		pb: number;
		entVal: number;
	};
	div: {
		net: number;
		yield: number;
	};
	capm: {
		beta: number;
		alpha: number;
		er: number;
		fv: number;
	};
	cashFlowYear: number;
	cashFlowData: (string | number)[][];
	incomeYear: number;
	incomeData: (string | number)[][];
	balanceYear: number;
	balanceData: (string | number)[][];
}

export interface GetPortfolioData {
	settled: SBZdb["public"]["Tables"]["settled_trades"]["Row"][];
	matched: NFdb["public"]["Tables"]["sbz-matched-trades"]["Row"][];
	onScreen: NFdb["public"]["Tables"]["on-screen-orders"]["Row"][];
	dmr: NFdb["public"]["Tables"]["sbz-dmb"]["Row"][];
	fxUsd: NFdb["public"]["Tables"]["fx"]["Row"];
}
