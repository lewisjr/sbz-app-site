export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instanciate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "12.2.2 (db9da0b)";
	};
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			"app-user-details": {
				Row: {
					btc_wallets: string[] | null;
					created_at: string;
					email: string;
					eth_wallets: string[] | null;
					f_name: string;
					id: string;
					l_name: string;
					luse_id: number[] | null;
					phone: number;
					platform: Database["public"]["Enums"]["neuroflow_platform"];
					polygon_wallets: string[] | null;
					push_id: string;
					tron_wallets: string[] | null;
				};
				Insert: {
					btc_wallets?: string[] | null;
					created_at?: string;
					email: string;
					eth_wallets?: string[] | null;
					f_name: string;
					id: string;
					l_name: string;
					luse_id?: number[] | null;
					phone: number;
					platform: Database["public"]["Enums"]["neuroflow_platform"];
					polygon_wallets?: string[] | null;
					push_id: string;
					tron_wallets?: string[] | null;
				};
				Update: {
					btc_wallets?: string[] | null;
					created_at?: string;
					email?: string;
					eth_wallets?: string[] | null;
					f_name?: string;
					id?: string;
					l_name?: string;
					luse_id?: number[] | null;
					phone?: number;
					platform?: Database["public"]["Enums"]["neuroflow_platform"];
					polygon_wallets?: string[] | null;
					push_id?: string;
					tron_wallets?: string[] | null;
				};
				Relationships: [];
			};
			"app-users": {
				Row: {
					active: boolean;
					created_at: string;
					push_id: string;
					uid: string | null;
				};
				Insert: {
					active?: boolean;
					created_at?: string;
					push_id: string;
					uid?: string | null;
				};
				Update: {
					active?: boolean;
					created_at?: string;
					push_id?: string;
					uid?: string | null;
				};
				Relationships: [];
			};
			"balance-sheets": {
				Row: {
					cce: number;
					created_at: string;
					currency: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					exchange: string;
					id: number;
					inv: number;
					lon_trm_dbt: number;
					oth_cur_ass: number;
					oth_cur_liab: number;
					oth_nonc_ass: number;
					oth_nonc_liab: number;
					payables: number;
					period: Database["public"]["Enums"]["reports_period"];
					ppe: number;
					recvbl: number;
					shr_trm_dbt: number;
					symbol: string;
					tot_ass: number;
					tot_cur_ass: number;
					tot_cur_liab: number;
					tot_eq: number;
					tot_eq_liab: number;
					tot_liab: number;
					tot_nonc_ass: number;
					tot_nonc_liab: number;
				};
				Insert: {
					cce: number;
					created_at?: string;
					currency?: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					exchange: string;
					id?: number;
					inv: number;
					lon_trm_dbt: number;
					oth_cur_ass: number;
					oth_cur_liab: number;
					oth_nonc_ass: number;
					oth_nonc_liab: number;
					payables: number;
					period: Database["public"]["Enums"]["reports_period"];
					ppe: number;
					recvbl: number;
					shr_trm_dbt: number;
					symbol: string;
					tot_ass: number;
					tot_cur_ass: number;
					tot_cur_liab: number;
					tot_eq: number;
					tot_eq_liab: number;
					tot_liab: number;
					tot_nonc_ass: number;
					tot_nonc_liab: number;
				};
				Update: {
					cce?: number;
					created_at?: string;
					currency?: string;
					date?: number;
					entity?: Database["public"]["Enums"]["reports_entity"];
					exchange?: string;
					id?: number;
					inv?: number;
					lon_trm_dbt?: number;
					oth_cur_ass?: number;
					oth_cur_liab?: number;
					oth_nonc_ass?: number;
					oth_nonc_liab?: number;
					payables?: number;
					period?: Database["public"]["Enums"]["reports_period"];
					ppe?: number;
					recvbl?: number;
					shr_trm_dbt?: number;
					symbol?: string;
					tot_ass?: number;
					tot_cur_ass?: number;
					tot_cur_liab?: number;
					tot_eq?: number;
					tot_eq_liab?: number;
					tot_liab?: number;
					tot_nonc_ass?: number;
					tot_nonc_liab?: number;
				};
				Relationships: [];
			};
			"cash-flow-statements": {
				Row: {
					capex: number;
					created_at: string;
					currency: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					exchange: string;
					fin_act: number;
					id: number;
					inv_act: number;
					op_act: number;
					open_bal: number;
					per_cash: number;
					period: Database["public"]["Enums"]["reports_period"];
					pref_div_paid: number;
					symbol: string;
				};
				Insert: {
					capex: number;
					created_at?: string;
					currency?: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					exchange: string;
					fin_act: number;
					id?: number;
					inv_act: number;
					op_act: number;
					open_bal: number;
					per_cash: number;
					period: Database["public"]["Enums"]["reports_period"];
					pref_div_paid: number;
					symbol: string;
				};
				Update: {
					capex?: number;
					created_at?: string;
					currency?: string;
					date?: number;
					entity?: Database["public"]["Enums"]["reports_entity"];
					exchange?: string;
					fin_act?: number;
					id?: number;
					inv_act?: number;
					op_act?: number;
					open_bal?: number;
					per_cash?: number;
					period?: Database["public"]["Enums"]["reports_period"];
					pref_div_paid?: number;
					symbol?: string;
				};
				Relationships: [];
			};
			dividends: {
				Row: {
					created_at: string;
					currency: string;
					dec_date: number;
					ex_date: number;
					exchange: string;
					id: number;
					pay_date: number;
					period: Database["public"]["Enums"]["reports_period"];
					reg_date: number;
					symbol: string;
					value: number;
				};
				Insert: {
					created_at?: string;
					currency?: string;
					dec_date: number;
					ex_date: number;
					exchange: string;
					id?: number;
					pay_date: number;
					period: Database["public"]["Enums"]["reports_period"];
					reg_date: number;
					symbol: string;
					value: number;
				};
				Update: {
					created_at?: string;
					currency?: string;
					dec_date?: number;
					ex_date?: number;
					exchange?: string;
					id?: number;
					pay_date?: number;
					period?: Database["public"]["Enums"]["reports_period"];
					reg_date?: number;
					symbol?: string;
					value?: number;
				};
				Relationships: [];
			};
			"economic-statistics": {
				Row: {
					country: string;
					created_at: string;
					currency: string | null;
					date: number;
					id: number;
					key: Database["public"]["Enums"]["economic_indicator_keys"];
					units: string | null;
					value: number;
				};
				Insert: {
					country: string;
					created_at?: string;
					currency?: string | null;
					date: number;
					id?: number;
					key: Database["public"]["Enums"]["economic_indicator_keys"];
					units?: string | null;
					value: number;
				};
				Update: {
					country?: string;
					created_at?: string;
					currency?: string | null;
					date?: number;
					id?: number;
					key?: Database["public"]["Enums"]["economic_indicator_keys"];
					units?: string | null;
					value?: number;
				};
				Relationships: [];
			};
			fx: {
				Row: {
					buy: number;
					created_at: string;
					currency: string;
					date: number;
					id: number;
					mid: number;
					sell: number;
					source: string;
				};
				Insert: {
					buy: number;
					created_at?: string;
					currency: string;
					date: number;
					id?: number;
					mid: number;
					sell: number;
					source: string;
				};
				Update: {
					buy?: number;
					created_at?: string;
					currency?: string;
					date?: number;
					id?: number;
					mid?: number;
					sell?: number;
					source?: string;
				};
				Relationships: [];
			};
			"income-statements": {
				Row: {
					admin_exp: number;
					cogs: number;
					created_at: string;
					currency: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					eps: number;
					exchange: string;
					fin_exp: number;
					g_prof: number;
					id: number;
					issued_shares: number;
					net_inc: number;
					other_fin_exp: number;
					other_inc_exp: number;
					other_op_exp: number;
					pbit: number;
					pbt: number;
					period: Database["public"]["Enums"]["reports_period"];
					revenue: number;
					symbol: string;
					tax_exp: number;
					tot_comp_inc: number;
				};
				Insert: {
					admin_exp: number;
					cogs: number;
					created_at?: string;
					currency?: string;
					date: number;
					entity: Database["public"]["Enums"]["reports_entity"];
					eps: number;
					exchange?: string;
					fin_exp: number;
					g_prof: number;
					id?: number;
					issued_shares: number;
					net_inc: number;
					other_fin_exp: number;
					other_inc_exp: number;
					other_op_exp: number;
					pbit: number;
					pbt: number;
					period: Database["public"]["Enums"]["reports_period"];
					revenue: number;
					symbol: string;
					tax_exp: number;
					tot_comp_inc: number;
				};
				Update: {
					admin_exp?: number;
					cogs?: number;
					created_at?: string;
					currency?: string;
					date?: number;
					entity?: Database["public"]["Enums"]["reports_entity"];
					eps?: number;
					exchange?: string;
					fin_exp?: number;
					g_prof?: number;
					id?: number;
					issued_shares?: number;
					net_inc?: number;
					other_fin_exp?: number;
					other_inc_exp?: number;
					other_op_exp?: number;
					pbit?: number;
					pbt?: number;
					period?: Database["public"]["Enums"]["reports_period"];
					revenue?: number;
					symbol?: string;
					tax_exp?: number;
					tot_comp_inc?: number;
				};
				Relationships: [];
			};
			industries: {
				Row: {
					created_at: string;
					exchange: string;
					id: number;
					name: string;
					symbols: string;
				};
				Insert: {
					created_at?: string;
					exchange: string;
					id?: number;
					name: string;
					symbols: string;
				};
				Update: {
					created_at?: string;
					exchange?: string;
					id?: number;
					name?: string;
					symbols?: string;
				};
				Relationships: [];
			};
			news: {
				Row: {
					analyst: string;
					country: string;
					created_at: string;
					date: number;
					exchange: string;
					id: number;
					pdf_json: Json;
					pdf_text: string;
					publisher: string;
					summary: string;
					symbol: string;
					title: string;
				};
				Insert: {
					analyst: string;
					country: string;
					created_at?: string;
					date: number;
					exchange: string;
					id?: number;
					pdf_json: Json;
					pdf_text: string;
					publisher: string;
					summary: string;
					symbol: string;
					title: string;
				};
				Update: {
					analyst?: string;
					country?: string;
					created_at?: string;
					date?: number;
					exchange?: string;
					id?: number;
					pdf_json?: Json;
					pdf_text?: string;
					publisher?: string;
					summary?: string;
					symbol?: string;
					title?: string;
				};
				Relationships: [];
			};
			"on-screen-orders": {
				Row: {
					broker: string;
					created_at: string;
					date: number;
					expiry: number;
					id: number;
					luse_id: number;
					market: string;
					names: string;
					order_side: Database["public"]["Enums"]["trade_type"];
					price: number;
					qty: number;
					symbol: string;
					trader: string;
				};
				Insert: {
					broker: string;
					created_at?: string;
					date: number;
					expiry: number;
					id?: number;
					luse_id: number;
					market: string;
					names: string;
					order_side: Database["public"]["Enums"]["trade_type"];
					price: number;
					qty: number;
					symbol: string;
					trader: string;
				};
				Update: {
					broker?: string;
					created_at?: string;
					date?: number;
					expiry?: number;
					id?: number;
					luse_id?: number;
					market?: string;
					names?: string;
					order_side?: Database["public"]["Enums"]["trade_type"];
					price?: number;
					qty?: number;
					symbol?: string;
					trader?: string;
				};
				Relationships: [];
			};
			otps: {
				Row: {
					otp: number;
					updated_at: string;
					username: string;
				};
				Insert: {
					otp: number;
					updated_at?: string;
					username: string;
				};
				Update: {
					otp?: number;
					updated_at?: string;
					username?: string;
				};
				Relationships: [];
			};
			portfolios: {
				Row: {
					broker: string;
					created_at: string;
					date_added: number;
					id: number;
					luse_id: number;
					market: string;
					names: string;
					symbol: string;
					volume: number;
				};
				Insert: {
					broker: string;
					created_at?: string;
					date_added: number;
					id?: number;
					luse_id: number;
					market: string;
					names: string;
					symbol: string;
					volume: number;
				};
				Update: {
					broker?: string;
					created_at?: string;
					date_added?: number;
					id?: number;
					luse_id?: number;
					market?: string;
					names?: string;
					symbol?: string;
					volume?: number;
				};
				Relationships: [];
			};
			projections: {
				Row: {
					created_at: string;
					date: number;
					er: number;
					future_steps: number;
					fv: number;
					history_length: number;
					id: number;
					last_val: number;
					last_val_date: number;
					market: string;
					metric: string;
				};
				Insert: {
					created_at?: string;
					date: number;
					er: number;
					future_steps: number;
					fv: number;
					history_length: number;
					id?: number;
					last_val: number;
					last_val_date: number;
					market: string;
					metric: string;
				};
				Update: {
					created_at?: string;
					date?: number;
					er?: number;
					future_steps?: number;
					fv?: number;
					history_length?: number;
					id?: number;
					last_val?: number;
					last_val_date?: number;
					market?: string;
					metric?: string;
				};
				Relationships: [];
			};
			"report-counters": {
				Row: {
					count: number;
					created_at: string;
					id: number;
					series: string;
					year: number;
				};
				Insert: {
					count: number;
					created_at?: string;
					id?: number;
					series: string;
					year: number;
				};
				Update: {
					count?: number;
					created_at?: string;
					id?: number;
					series?: string;
					year?: number;
				};
				Relationships: [];
			};
			"sbz-dmb": {
				Row: {
					ask: number;
					ask_vol: number;
					bid: number;
					bid_vol: number;
					created_at: string;
					date: number;
					delta: number;
					delta_abs: number;
					div_yield: number;
					exchange: string;
					id: number;
					is_first: boolean;
					is_last: boolean;
					issued_shares: number;
					market_cap: number;
					market_price: number;
					pbv: number;
					pe: number;
					source: Database["public"]["Enums"]["luse_data_src"];
					symbol: string;
					traded_vol: number;
					trail_52_high: number;
					trail_52_low: number;
					turnover: number;
					ytd: number;
				};
				Insert: {
					ask: number;
					ask_vol: number;
					bid: number;
					bid_vol: number;
					created_at?: string;
					date: number;
					delta: number;
					delta_abs: number;
					div_yield: number;
					exchange?: string;
					id?: number;
					is_first?: boolean;
					is_last?: boolean;
					issued_shares: number;
					market_cap?: number;
					market_price: number;
					pbv: number;
					pe: number;
					source: Database["public"]["Enums"]["luse_data_src"];
					symbol: string;
					traded_vol: number;
					trail_52_high: number;
					trail_52_low: number;
					turnover: number;
					ytd: number;
				};
				Update: {
					ask?: number;
					ask_vol?: number;
					bid?: number;
					bid_vol?: number;
					created_at?: string;
					date?: number;
					delta?: number;
					delta_abs?: number;
					div_yield?: number;
					exchange?: string;
					id?: number;
					is_first?: boolean;
					is_last?: boolean;
					issued_shares?: number;
					market_cap?: number;
					market_price?: number;
					pbv?: number;
					pe?: number;
					source?: Database["public"]["Enums"]["luse_data_src"];
					symbol?: string;
					traded_vol?: number;
					trail_52_high?: number;
					trail_52_low?: number;
					turnover?: number;
					ytd?: number;
				};
				Relationships: [];
			};
			"sbz-matched-trades": {
				Row: {
					broker: string;
					counterparty_broker: string;
					counterparty_luse_id: number;
					counterparty_name: string;
					created_at: string;
					id: number;
					luse_id: number;
					market: string;
					names: string;
					price: number;
					qty: number;
					settlement_date: number;
					symbol: string;
					trade_date: number;
					trade_side: Database["public"]["Enums"]["trade_type"];
					trade_time: string;
					trader: string;
				};
				Insert: {
					broker: string;
					counterparty_broker: string;
					counterparty_luse_id: number;
					counterparty_name: string;
					created_at?: string;
					id?: number;
					luse_id: number;
					market: string;
					names: string;
					price: number;
					qty: number;
					settlement_date: number;
					symbol: string;
					trade_date: number;
					trade_side: Database["public"]["Enums"]["trade_type"];
					trade_time: string;
					trader: string;
				};
				Update: {
					broker?: string;
					counterparty_broker?: string;
					counterparty_luse_id?: number;
					counterparty_name?: string;
					created_at?: string;
					id?: number;
					luse_id?: number;
					market?: string;
					names?: string;
					price?: number;
					qty?: number;
					settlement_date?: number;
					symbol?: string;
					trade_date?: number;
					trade_side?: Database["public"]["Enums"]["trade_type"];
					trade_time?: string;
					trader?: string;
				};
				Relationships: [];
			};
			"symbol-metrics": {
				Row: {
					acp: number;
					alpha: number;
					app: number;
					ass_turn: number;
					beta: number;
					cfps: number;
					created_at: string;
					current: number;
					date: number;
					div_yield: number;
					ent_val: number;
					eps: number;
					eq_mult: number;
					er: number;
					exchange: string;
					fv: number;
					gpm: number;
					id: number;
					navps: number;
					net_div: number;
					npm: number;
					pbitm: number;
					pbtm: number;
					pbv: number;
					pe: number;
					price: number;
					quick: number;
					roa: number;
					roa_dupont: number;
					roe: number;
					roe_dupont: number;
					roi: number;
					symbol: string;
					tax_brd: number;
					ytd: number;
				};
				Insert: {
					acp: number;
					alpha: number;
					app: number;
					ass_turn: number;
					beta: number;
					cfps: number;
					created_at?: string;
					current: number;
					date: number;
					div_yield: number;
					ent_val: number;
					eps: number;
					eq_mult: number;
					er: number;
					exchange?: string;
					fv: number;
					gpm: number;
					id?: number;
					navps: number;
					net_div: number;
					npm: number;
					pbitm: number;
					pbtm: number;
					pbv: number;
					pe: number;
					price: number;
					quick: number;
					roa: number;
					roa_dupont: number;
					roe: number;
					roe_dupont: number;
					roi: number;
					symbol: string;
					tax_brd: number;
					ytd: number;
				};
				Update: {
					acp?: number;
					alpha?: number;
					app?: number;
					ass_turn?: number;
					beta?: number;
					cfps?: number;
					created_at?: string;
					current?: number;
					date?: number;
					div_yield?: number;
					ent_val?: number;
					eps?: number;
					eq_mult?: number;
					er?: number;
					exchange?: string;
					fv?: number;
					gpm?: number;
					id?: number;
					navps?: number;
					net_div?: number;
					npm?: number;
					pbitm?: number;
					pbtm?: number;
					pbv?: number;
					pe?: number;
					price?: number;
					quick?: number;
					roa?: number;
					roa_dupont?: number;
					roe?: number;
					roe_dupont?: number;
					roi?: number;
					symbol?: string;
					tax_brd?: number;
					ytd?: number;
				};
				Relationships: [];
			};
			"symbol-recommendations": {
				Row: {
					analyst: string;
					created_at: string;
					data: Json;
					date: number;
					id: number;
				};
				Insert: {
					analyst: string;
					created_at?: string;
					data: Json;
					date: number;
					id?: number;
				};
				Update: {
					analyst?: string;
					created_at?: string;
					data?: Json;
					date?: number;
					id?: number;
				};
				Relationships: [];
			};
			users: {
				Row: {
					created_at: string;
					email: string;
					org: string | null;
					permissions: string | null;
					phone: number;
					username: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					org?: string | null;
					permissions?: string | null;
					phone: number;
					username: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					org?: string | null;
					permissions?: string | null;
					phone?: number;
					username?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			economic_indicator_keys:
				| "91d_tbill"
				| "182d_tbill"
				| "273d_tbill"
				| "364d_tbill"
				| "2y_gbond"
				| "3y_gbond"
				| "5y_gbond"
				| "7y_gbond"
				| "10y_gbond"
				| "15y_gbond"
				| "cpi"
				| "mpr"
				| "inflation_yoy"
				| "inflation_mom"
				| "gdp"
				| "gdp_capita"
				| "gdp_grow_yoy"
				| "gdp_grow_quart"
				| "population"
				| "unemploy_yoy"
				| "trade_balance"
				| "imports"
				| "exports"
				| "for_dir_inv"
				| "cur_acc"
				| "corrupt_index"
				| "corrupt_rank"
				| "gov_debt"
				| "corp_tax_rate"
				| "pers_tax_rate"
				| "vat"
				| "co2_emissions"
				| "deposit_rate"
				| "lending_rate"
				| "fx_usd"
				| "sm_index";
			luse_data_src: "luse" | "sbz" | "ats";
			neuroflow_platform: "iOS" | "Android" | "Emulator";
			reports_entity: "Group" | "Company";
			reports_period: "FY" | "HY" | "Q1" | "Q3";
			trade_type: "buy" | "sell";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			economic_indicator_keys: [
				"91d_tbill",
				"182d_tbill",
				"273d_tbill",
				"364d_tbill",
				"2y_gbond",
				"3y_gbond",
				"5y_gbond",
				"7y_gbond",
				"10y_gbond",
				"15y_gbond",
				"cpi",
				"mpr",
				"inflation_yoy",
				"inflation_mom",
				"gdp",
				"gdp_capita",
				"gdp_grow_yoy",
				"gdp_grow_quart",
				"population",
				"unemploy_yoy",
				"trade_balance",
				"imports",
				"exports",
				"for_dir_inv",
				"cur_acc",
				"corrupt_index",
				"corrupt_rank",
				"gov_debt",
				"corp_tax_rate",
				"pers_tax_rate",
				"vat",
				"co2_emissions",
				"deposit_rate",
				"lending_rate",
				"fx_usd",
				"sm_index",
			],
			luse_data_src: ["luse", "sbz", "ats"],
			neuroflow_platform: ["iOS", "Android", "Emulator"],
			reports_entity: ["Group", "Company"],
			reports_period: ["FY", "HY", "Q1", "Q3"],
			trade_type: ["buy", "sell"],
		},
	},
} as const;
