const supabaseUrl = "https://ibccdlzhptosofuahsxb.supabase.co";
const supabasekey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2NkbHpocHRvc29mdWFoc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODAxNTcsImV4cCI6MjEwMDE1NjE1N30.pY41HzxkrTnUrgi5_xGKVdy3-BSeqVqRDjpmPUMfndQ";

const supabaseClient = supabase.createClient(supabaseUrl, supabasekey);

export default supabaseClient;
