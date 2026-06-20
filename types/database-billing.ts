import type { Database } from "@/types/database.generated";

type SubscriptionsTable = {
  Row: {
    created_at: string;
    id: string;
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    updated_at: string;
    user_id: string;
  };
  Insert: {
    created_at?: string;
    id?: string;
    plan: string;
    status: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    updated_at?: string;
    user_id: string;
  };
  Update: {
    created_at?: string;
    id?: string;
    plan?: string;
    status?: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    updated_at?: string;
    user_id?: string;
  };
  Relationships: [];
};

export type DatabaseWithSubscriptions = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      subscriptions: SubscriptionsTable;
    };
  };
};
