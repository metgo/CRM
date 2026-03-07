export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClientStatus =
  | "lead"
  | "active"
  | "negotiation"
  | "paused"
  | "closed";

export type CommunicationType =
  | "sms"
  | "email"
  | "whatsapp"
  | "call"
  | "meeting"
  | "note";

export type TemplateType = "sms" | "email" | "whatsapp";

export type UserRole = "admin" | "agent";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          status: ClientStatus;
          region: string | null;
          address: string | null;
          website: string | null;
          notes: string | null;
          assigned_to: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          status?: ClientStatus;
          region?: string | null;
          address?: string | null;
          website?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: ClientStatus;
          region?: string | null;
          address?: string | null;
          website?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          first_name: string;
          last_name: string;
          role_title: string | null;
          phone: string | null;
          email: string | null;
          whatsapp: string | null;
          is_primary: boolean;
          notes: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          first_name: string;
          last_name: string;
          role_title?: string | null;
          phone?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          role_title?: string | null;
          phone?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      communications: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          contact_id: string | null;
          user_id: string;
          type: CommunicationType;
          direction: "outbound" | "inbound";
          subject: string | null;
          body: string;
          status: string | null;
          inforu_message_id: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          contact_id?: string | null;
          user_id: string;
          type: CommunicationType;
          direction?: "outbound" | "inbound";
          subject?: string | null;
          body: string;
          status?: string | null;
          inforu_message_id?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string | null;
          inforu_message_id?: string | null;
        };
      };
      templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: TemplateType;
          subject: string | null;
          body: string;
          variables: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: TemplateType;
          subject?: string | null;
          body: string;
          variables?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: TemplateType;
          subject?: string | null;
          body?: string;
          variables?: string[];
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          client_id: string | null;
          title: string;
          notes: string | null;
          due_at: string;
          is_done: boolean;
          done_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          client_id?: string | null;
          title: string;
          notes?: string | null;
          due_at: string;
          is_done?: boolean;
          done_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          notes?: string | null;
          due_at?: string;
          is_done?: boolean;
          done_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types with joins
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Communication =
  Database["public"]["Tables"]["communications"]["Row"];
export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ClientWithContacts = Client & {
  contacts: Contact[];
  profiles?: Profile;
};

export type ReminderWithClient = Reminder & {
  clients: Pick<Client, "id" | "name"> | null;
};

export type CommunicationWithDetails = Communication & {
  contacts: Pick<Contact, "id" | "first_name" | "last_name"> | null;
  profiles: Pick<Profile, "id" | "full_name"> | null;
};
