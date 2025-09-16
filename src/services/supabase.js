import { createClient } from "@supabase/supabase-js";
export const supabaseUrl = "https://aurbgdomasevbusqekah.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmJnZG9tYXNldmJ1c3Fla2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMTQ0MzQsImV4cCI6MjA3MDg5MDQzNH0.OFrppVhekfOXNQWNSb-qwv75y_4HW1FpBCSf_9BvBE4";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
