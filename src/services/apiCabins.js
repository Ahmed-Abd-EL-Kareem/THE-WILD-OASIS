import { uploadImageToCloudinary } from "./cloudinary";
import { graphqlRequest } from "./graphqlClient";

export async function getCabins() {
  const data = await graphqlRequest(
    `
      query GetAllCabins(
        $sort: CabinSortArgs
        $pagination: PaginationArgs
      ) {
        getAllCabins(sort: $sort, pagination: $pagination) {
          data {
            id
            name
            maxCapacity
            regularPrice
            discount
            description
            image
            createdAt
          }
          total
          page
          limit
          totalPages
        }
      }
    `,
    {
      sort: { field: "PRICE", order: "ASC" },
      pagination: { page: 1, limit: 100 },
    }
  );

  const payload = data.getAllCabins;
  if (Array.isArray(payload)) return payload;
  return payload?.data || [];
}
export async function createEditCabin(newCabin, id) {
  const image =
    typeof newCabin.image === "string"
      ? newCabin.image
      : await uploadImageToCloudinary(newCabin.image);

  const cabinInput = {
    name: newCabin.name,
    maxCapacity: Number(newCabin.maxCapacity),
    regularPrice: Number(newCabin.regularPrice),
    discount: Number(newCabin.discount || 0),
    description: newCabin.description,
    image,
  };

  if (!id) {
    const data = await graphqlRequest(
      `
        mutation CreateCabin($cabinInput: CabinDto!) {
          createCabin(cabinInput: $cabinInput) {
            id
            name
            maxCapacity
            regularPrice
            discount
            description
            image
            createdAt
          }
        }
      `,
      { cabinInput }
    );
    return data.createCabin;
  }

  const data = await graphqlRequest(
    `
      mutation UpdateCabin($id: Float!, $cabinUpdate: CabinUpdateDto!) {
        updateCabin(id: $id, cabinUpdate: $cabinUpdate) {
          id
          name
          maxCapacity
          regularPrice
          discount
          description
          image
          createdAt
        }
      }
    `,
    {
      id: Number(id),
      cabinUpdate: cabinInput,
    }
  );

  return data.updateCabin;
}
export async function deleteCabin(id) {
  const data = await graphqlRequest(
    `
      mutation DeleteCabin($id: Float!) {
        deleteCabin(id: $id)
      }
    `,
    { id: Number(id) }
  );

  return data.deleteCabin;
}
