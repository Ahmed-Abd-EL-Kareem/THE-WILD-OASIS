import supabase from "./supabase";

// Calls an Edge Function that lists auth users (implemented in Supabase)
// Function name suggestion: list-users
// It should use the Service Role key on the server side, NOT from the client.
// This client call uses the anon key only to invoke the function.
export async function getAuthUsers() {
  const { data, error } = await supabase.functions.invoke("list-users", {
    body: {},
  });
  if (error) throw new Error(error.message || "Could not load auth users");

  const { users } = data || {};
  // Normalize to { id, email, fullName }
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName:
      u.user_metadata?.full_name || u.user_metadata?.fullName || u.email,
  }));
}
