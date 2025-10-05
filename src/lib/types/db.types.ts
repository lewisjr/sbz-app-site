export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.4";
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
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
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
			admins: {
				Row: {
					approved: boolean;
					created_at: string;
					created_by: string;
					department: string;
					email: string;
					full_names: string;
					permissions: string;
					phone: string;
					ticketable: boolean;
					username: string;
				};
				Insert: {
					approved?: boolean;
					created_at?: string;
					created_by: string;
					department: string;
					email: string;
					full_names: string;
					permissions: string;
					phone: string;
					ticketable?: boolean;
					username: string;
				};
				Update: {
					approved?: boolean;
					created_at?: string;
					created_by?: string;
					department?: string;
					email?: string;
					full_names?: string;
					permissions?: string;
					phone?: string;
					ticketable?: boolean;
					username?: string;
				};
				Relationships: [];
			};
			clients: {
				Row: {
					acc_type: string;
					bank_acc_name: string;
					bank_acc_num: string;
					bank_name: string;
					branch_code: string;
					branch_name: string;
					city: string;
					comp_directors: Json[];
					comp_managers: Json[];
					country: string;
					created_at: string;
					dob: string;
					email: string;
					fname: string;
					gender: string;
					id_num: string;
					id_type: string;
					is_approved: boolean;
					is_in_trust_of: boolean;
					joint_partners: Json[];
					lname: string;
					luseId: number;
					manag_city: string;
					manag_country: string;
					manag_dob: string;
					manag_email: string;
					manag_fname: string;
					manag_gender: string;
					manag_id_num: string;
					manag_id_type: string;
					manag_lname: string;
					manag_mstatus: string;
					manag_nationality: string;
					manag_phone: number;
					manag_street: string;
					mstatus: string;
					nationality: string;
					phone: number;
					signatures: Json;
					signing_arrangement: number;
					street: string;
					swift_code: string;
				};
				Insert: {
					acc_type: string;
					bank_acc_name: string;
					bank_acc_num: string;
					bank_name: string;
					branch_code: string;
					branch_name: string;
					city: string;
					comp_directors: Json[];
					comp_managers: Json[];
					country: string;
					created_at?: string;
					dob: string;
					email: string;
					fname: string;
					gender: string;
					id_num: string;
					id_type: string;
					is_approved?: boolean;
					is_in_trust_of?: boolean;
					joint_partners: Json[];
					lname: string;
					luseId?: number;
					manag_city: string;
					manag_country: string;
					manag_dob: string;
					manag_email: string;
					manag_fname: string;
					manag_gender: string;
					manag_id_num: string;
					manag_id_type: string;
					manag_lname: string;
					manag_mstatus: string;
					manag_nationality: string;
					manag_phone: number;
					manag_street: string;
					mstatus: string;
					nationality: string;
					phone: number;
					signatures: Json;
					signing_arrangement?: number;
					street: string;
					swift_code: string;
				};
				Update: {
					acc_type?: string;
					bank_acc_name?: string;
					bank_acc_num?: string;
					bank_name?: string;
					branch_code?: string;
					branch_name?: string;
					city?: string;
					comp_directors?: Json[];
					comp_managers?: Json[];
					country?: string;
					created_at?: string;
					dob?: string;
					email?: string;
					fname?: string;
					gender?: string;
					id_num?: string;
					id_type?: string;
					is_approved?: boolean;
					is_in_trust_of?: boolean;
					joint_partners?: Json[];
					lname?: string;
					luseId?: number;
					manag_city?: string;
					manag_country?: string;
					manag_dob?: string;
					manag_email?: string;
					manag_fname?: string;
					manag_gender?: string;
					manag_id_num?: string;
					manag_id_type?: string;
					manag_lname?: string;
					manag_mstatus?: string;
					manag_nationality?: string;
					manag_phone?: number;
					manag_street?: string;
					mstatus?: string;
					nationality?: string;
					phone?: number;
					signatures?: Json;
					signing_arrangement?: number;
					street?: string;
					swift_code?: string;
				};
				Relationships: [];
			};
			logs: {
				Row: {
					created_at: string;
					id: number;
					title: string;
					value: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					title: string;
					value: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					title?: string;
					value?: string;
				};
				Relationships: [];
			};
			"odyn-cache": {
				Row: {
					position: string;
					udf: string;
					uid: string;
				};
				Insert: {
					position: string;
					udf: string;
					uid: string;
				};
				Update: {
					position?: string;
					udf?: string;
					uid?: string;
				};
				Relationships: [];
			};
			"odyn-chats": {
				Row: {
					body: string;
					created_at: string;
					id: number;
					sender: string;
					ticket_no: string;
					type: Database["public"]["Enums"]["message_type"];
				};
				Insert: {
					body: string;
					created_at?: string;
					id?: number;
					sender: string;
					ticket_no: string;
					type?: Database["public"]["Enums"]["message_type"];
				};
				Update: {
					body?: string;
					created_at?: string;
					id?: number;
					sender?: string;
					ticket_no?: string;
					type?: Database["public"]["Enums"]["message_type"];
				};
				Relationships: [];
			};
			"odyn-history": {
				Row: {
					created_at: string;
					creator: string;
					id: number;
					message: string;
					ticket_no: string;
				};
				Insert: {
					created_at?: string;
					creator: string;
					id?: number;
					message: string;
					ticket_no: string;
				};
				Update: {
					created_at?: string;
					creator?: string;
					id?: number;
					message?: string;
					ticket_no?: string;
				};
				Relationships: [];
			};
			"odyn-tickets": {
				Row: {
					assigned: string;
					assignee_email_vars: string | null;
					close_date: string | null;
					close_reason: string | null;
					closed_by: string | null;
					created_at: string;
					email: string;
					email_vars: string | null;
					id: string;
					id_num: string;
					is_client: boolean;
					is_closed: boolean;
					luse_id: number;
					names: string;
					object: Json | null;
					phone: string;
					platform: string;
					query: string;
					query_type: string;
					referral_source: string;
					uid: string;
				};
				Insert: {
					assigned: string;
					assignee_email_vars?: string | null;
					close_date?: string | null;
					close_reason?: string | null;
					closed_by?: string | null;
					created_at?: string;
					email: string;
					email_vars?: string | null;
					id: string;
					id_num: string;
					is_client?: boolean;
					is_closed?: boolean;
					luse_id: number;
					names: string;
					object?: Json | null;
					phone: string;
					platform: string;
					query: string;
					query_type: string;
					referral_source: string;
					uid: string;
				};
				Update: {
					assigned?: string;
					assignee_email_vars?: string | null;
					close_date?: string | null;
					close_reason?: string | null;
					closed_by?: string | null;
					created_at?: string;
					email?: string;
					email_vars?: string | null;
					id?: string;
					id_num?: string;
					is_client?: boolean;
					is_closed?: boolean;
					luse_id?: number;
					names?: string;
					object?: Json | null;
					phone?: string;
					platform?: string;
					query?: string;
					query_type?: string;
					referral_source?: string;
					uid?: string;
				};
				Relationships: [];
			};
			otps: {
				Row: {
					id: string;
					otp: number;
					updated_at: string;
				};
				Insert: {
					id: string;
					otp: number;
					updated_at: string;
				};
				Update: {
					id?: string;
					otp?: number;
					updated_at?: string;
				};
				Relationships: [];
			};
			"system-vars": {
				Row: {
					created_at: string;
					id: number;
					key: string;
					value: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					key: string;
					value: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					key?: string;
					value?: string;
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
			message_type: "text" | "pdf" | "command" | "img";
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
			message_type: ["text", "pdf", "command", "img"],
		},
	},
} as const;
