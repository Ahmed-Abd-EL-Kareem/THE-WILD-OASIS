import { PAGE_SIZE } from "../utils/constants";
import { getToday } from "../utils/helpers";
import { graphqlRequest } from "./graphqlClient";

const STATUS_TO_UI = {
  UNCONFIRMED: "unconfirmed",
  CHECKED_IN: "checked-in",
  CHECKED_OUT: "checked-out",
};

const STATUS_TO_API = {
  unconfirmed: "UNCONFIRMED",
  "checked-in": "CHECKED_IN",
  "checked-out": "CHECKED_OUT",
};

const SORT_FIELD_TO_API = {
  startDate: "START_DATE",
  endDate: "END_DATE",
  totalPrice: "TOTAL_PRICE",
  createdAt: "CREATED_AT",
  numNights: "NUM_NIGHTS",
  numGuests: "NUM_GUESTS",
};

function normalizeBooking(booking) {
  return {
    ...booking,
    created_at: booking.createdAt,
    status: STATUS_TO_UI[booking.status] || booking.status,
    guests: booking.guest || booking.guests,
    cabins: booking.cabin || booking.cabins,
  };
}

function toIsoDate(date) {
  if (!date) return null;
  if (date.includes("T")) return date;
  return `${date}T00:00:00.000Z`;
}

export async function getBookings({ filter, sortBy, page, search, limit }) {
  const status = filter?.value ? STATUS_TO_API[filter.value] : undefined;
  const sortField = sortBy?.field ? SORT_FIELD_TO_API[sortBy.field] : undefined;
  const sortOrder = sortBy?.direction ? sortBy.direction.toUpperCase() : undefined;
  const trimmedSearch = search?.trim();
  const searchInput = (() => {
    if (!trimmedSearch) return undefined;
    if (trimmedSearch.includes("@")) return { guestEmail: trimmedSearch };
    if (trimmedSearch.toLowerCase().startsWith("cabin:")) {
      const cabinName = trimmedSearch.slice(6).trim();
      return cabinName ? { cabinName } : undefined;
    }
    return { guestName: trimmedSearch };
  })();

  const data = await graphqlRequest(
    `
      query GetAllBookings(
        $filter: BookingFilterArgs
        $search: BookingSearchArgs
        $sort: BookingSortArgs
        $pagination: PaginationArgs
      ) {
        getAllBookings(
          filter: $filter
          search: $search
          sort: $sort
          pagination: $pagination
        ) {
          data {
            id
            createdAt
            startDate
            endDate
            numNights
            numGuests
            cabinPrice
            extrasPrice
            totalPrice
            status
            hasBreakfast
            isPaid
            observations
            cabin {
              id
              name
              image
              regularPrice
            }
            guest {
              id
              fullName
              email
              nationalID
              nationality
              avatar
            }
          }
          total
          page
          limit
          totalPages
        }
      }
    `,
    {
      filter: status ? { status } : undefined,
      search: searchInput,
      sort:
        sortField && sortOrder
          ? {
              field: sortField,
              order: sortOrder,
            }
          : undefined,
      pagination: {
        page: page || 1,
        limit: limit || PAGE_SIZE,
      },
    }
  );

  const payload = data.getAllBookings;
  const bookings = (Array.isArray(payload) ? payload : payload?.data || []).map(
    normalizeBooking
  );
  const count = Array.isArray(payload) ? bookings.length : (payload?.total ?? 0);

  return { data: bookings, count };
}
export async function getBooking(id) {
  const data = await graphqlRequest(
    `
      query GetBookingById($id: Float!) {
        getBookingById(id: $id) {
          id
          createdAt
          startDate
          endDate
          numNights
          numGuests
          cabinPrice
          extrasPrice
          totalPrice
          status
          hasBreakfast
          isPaid
          observations
          cabin {
            id
            name
            image
            maxCapacity
            regularPrice
            discount
          }
          guest {
            id
            fullName
            email
            nationalID
            nationality
            avatar
          }
        }
      }
    `,
    { id: Number(id) }
  );

  return normalizeBooking(data.getBookingById);
}

// Returns all BOOKINGS that are were created after the given date. Useful to get bookings created in the last 30 days, for example.
export async function getBookingsAfterDate(date) {
  const { data } = await getBookings({ page: 1, limit: 1000 });
  return data
    .filter(
      (booking) =>
        new Date(booking.created_at) >= new Date(date) &&
        new Date(booking.created_at) <= new Date(getToday({ end: true }))
    )
    .map((booking) => ({
      created_at: booking.created_at,
      totalPrice: booking.totalPrice,
      extrasPrice: booking.extrasPrice,
    }));
}

// Returns all STAYS that are were created after the given date
export async function getStaysAfterDate(date) {
  const { data } = await getBookings({ page: 1, limit: 1000 });
  return data.filter(
    (booking) =>
      new Date(booking.startDate) >= new Date(date) &&
      new Date(booking.startDate) <= new Date(getToday({ end: true }))
  );
}

// Activity means that there is a check in or a check out today
export async function getStaysTodayActivity() {
  const today = getToday().slice(0, 10);
  const allBookings = await graphqlRequest(
    `
      query GetAllBookings($pagination: PaginationArgs) {
        getAllBookings(pagination: $pagination) {
          data {
            id
            createdAt
            startDate
            endDate
            numNights
            numGuests
            cabinPrice
            extrasPrice
            totalPrice
            status
            hasBreakfast
            isPaid
            observations
            cabin {
              id
              name
              image
              regularPrice
            }
            guest {
              id
              fullName
              email
              nationalID
              nationality
              avatar
            }
          }
        }
      }
    `,
    { pagination: { page: 1, limit: 1000 } }
  );

  const rows = (
    Array.isArray(allBookings.getAllBookings)
      ? allBookings.getAllBookings
      : allBookings.getAllBookings?.data || []
  ).map(normalizeBooking);

  return rows
    .filter(
      (booking) =>
        (booking.status === "unconfirmed" &&
          booking.startDate.slice(0, 10) === today) ||
        (booking.status === "checked-in" && booking.endDate.slice(0, 10) === today)
    )
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

export async function updateBooking(id, obj) {
  const bookingUpdate = {
    ...obj,
    status: obj.status ? STATUS_TO_API[obj.status] || obj.status : undefined,
    startDate: obj.startDate ? toIsoDate(obj.startDate) : undefined,
    endDate: obj.endDate ? toIsoDate(obj.endDate) : undefined,
    cabinId: obj.cabinId ? Number(obj.cabinId) : undefined,
    guestId: obj.guestId ? Number(obj.guestId) : undefined,
  };

  Object.keys(bookingUpdate).forEach((key) => {
    if (bookingUpdate[key] === undefined) delete bookingUpdate[key];
  });

  const data = await graphqlRequest(
    `
      mutation UpdateBooking($id: Float!, $bookingUpdate: BookingUpdateDto!) {
        updateBooking(id: $id, bookingUpdate: $bookingUpdate) {
          id
          createdAt
          startDate
          endDate
          numNights
          numGuests
          cabinPrice
          extrasPrice
          totalPrice
          status
          hasBreakfast
          isPaid
          observations
          cabin {
            id
            name
            image
            regularPrice
          }
          guest {
            id
            fullName
            email
            nationalID
            nationality
          }
        }
      }
    `,
    { id: Number(id), bookingUpdate }
  );

  return normalizeBooking(data.updateBooking);
}

export async function deleteBooking(id) {
  const data = await graphqlRequest(
    `
      mutation DeleteBooking($id: Float!) {
        deleteBooking(id: $id)
      }
    `,
    { id: Number(id) }
  );
  return data.deleteBooking;
}

export async function createBooking(newBooking) {
  const bookingInput = {
    startDate: toIsoDate(newBooking.startDate),
    endDate: toIsoDate(newBooking.endDate),
    numNights: Number(newBooking.numNights),
    numGuests: Number(newBooking.numGuests),
    extrasPrice: Number(newBooking.extrasPrice || 0),
    hasBreakfast: Boolean(newBooking.hasBreakfast),
    isPaid: Boolean(newBooking.isPaid),
    observations: newBooking.observations || "",
    cabinId: Number(newBooking.cabinId),
    guestId: Number(newBooking.guestId),
  };

  const data = await graphqlRequest(
    `
      mutation CreateBooking($bookingInput: BookingDto!) {
        createBooking(bookingInput: $bookingInput) {
          id
          createdAt
          startDate
          endDate
          numNights
          numGuests
          cabinPrice
          extrasPrice
          totalPrice
          status
          hasBreakfast
          isPaid
          observations
        }
      }
    `,
    { bookingInput }
  );
  return normalizeBooking(data.createBooking);
}

export async function editBooking(id, newBooking) {
  return updateBooking(id, newBooking);
}
