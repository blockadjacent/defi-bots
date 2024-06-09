import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase.types";

export const getSupabaseAnonClient = () => {
    return createClient<Database>(
        process.env.SUPABASE_API_URL || "",
        process.env.SUPABASE_ANON_SERVICE_ROLE_KEY || "",
        {
            db: {
                schema: "public",
            },
            auth: {
                persistSession: false,
            },
        }
    );
};

export const getSupabaseAdminClient = () => {
    return createClient<Database>(process.env.SUPABASE_API_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
        db: {
            schema: "public",
        },
        auth: {
            persistSession: false,
        },
    });
};
