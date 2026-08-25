//const SUPABASE_URL = "https://qweyjpqxvixyzoremhon.supabase.co";
//const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZXlqcHF4dml4eXpvcmVtaG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTIzOTYsImV4cCI6MjA5OTc4ODM5Nn0.Bntl040U9kmWm2YmtJYcqUZ3n7SkhfOb581FTh-3xt4";
//const ADMIN_EMAILS = ["mdrafiuzzamanking99@gmail.com"];

//const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================
// MRZN — Supabase Client
// ==========================================

const SUPABASE_URL =
  "https://qweyjpqxvixyzoremhon.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZXlqcHF4dml4eXpvcmVtaG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTIzOTYsImV4cCI6MjA5OTc4ODM5Nn0.Bntl040U9kmWm2YmtJYcqUZ3n7SkhfOb581FTh-3xt4";

const ADMIN_EMAILS = [
  "mdrafiuzzamanking99@gmail.com"
];

// ------------------------------------------
// Create Supabase client
// ------------------------------------------

if (!window.supabase) {
  console.error("❌ Supabase library is not loaded.");
} else {
  try {
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    // IMPORTANT:
    // Make the client globally available
    // so MRZN AI and other JS files can use it.
    window.supabaseClient = supabaseClient;

    console.log("✅ Supabase client initialized");
  } catch (error) {
    console.error("❌ Supabase initialization failed:", error);
  }
}

// ------------------------------------------
// Helpers
// ------------------------------------------

window.isAdminEmail = function (email) {
  if (!email) return false;

  return ADMIN_EMAILS
    .map(e => e.toLowerCase())
    .includes(email.toLowerCase());
};

// ------------------------------------------
// Connection test
// ------------------------------------------

window.testSupabaseConnection = async function () {
  if (!window.supabaseClient) {
    console.error("❌ Supabase client not connected.");
    return {
      connected: false,
      error: "Supabase client not initialized"
    };
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("apps")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Supabase database error:", error);

      return {
        connected: false,
        error
      };
    }

    console.log("✅ Supabase database connected");
    console.log("📦 Test app data:", data);

    return {
      connected: true,
      data
    };

  } catch (error) {
    console.error("❌ Supabase connection failed:", error);

    return {
      connected: false,
      error
    };
  }
};
