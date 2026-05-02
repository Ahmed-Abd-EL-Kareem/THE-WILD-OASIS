import { graphqlRequest } from "./graphqlClient";

// Calls an Edge Function that lists auth users (implemented in Supabase)
// Function name suggestion: list-users
// It should use the Service Role key on the server side, NOT from the client.
// This client call uses the anon key only to invoke the function.
export async function getAuthUsers() {
  const data = await graphqlRequest(`
    query GetAllCustomers {
      getAllCustomers {
        id
        email
        fullName
      }
    }
  `);

  return data.getAllCustomers;
}
