import { graphqlRequest } from "./graphqlClient";

export async function getGuests() {
  const data = await graphqlRequest(`
    query GetAllCustomers {
      getAllCustomers {
        id
        fullName
        email
        nationalID
        nationality
        avatar
        role
        createdAt
      }
    }
  `);

  return data.getAllCustomers;
}

