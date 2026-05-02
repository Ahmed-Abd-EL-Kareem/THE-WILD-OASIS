# Backend Integration Guide — Cabins NestJS API

> Hand this file to Cursor. It contains everything needed to wire the NestJS GraphQL backend into the main booking site and the admin dashboard.

---

## Backend Overview

- **Framework:** NestJS 11 + GraphQL (Apollo, code-first)
- **Transport:** GraphQL only (no REST endpoints except `GET /health` and `GET /`)
- **Auth:** JWT (access + refresh) + Google OAuth + Local (email/password)
- **Database:** PostgreSQL via TypeORM
- **GraphQL Playground:** Available at `http://localhost:3000/graphql` (Apollo Sandbox)
- **Schema file:** `src/schema.gql` (auto-generated, do not edit manually)

---

## Base URL

```
Development: http://localhost:3000/graphql
Production:  https://<your-railway-domain>.up.railway.app/graphql
```

All requests are `POST` to `/graphql`.

---

## Authentication

### Token Storage (Frontend)
Store tokens in `httpOnly` cookies or `localStorage` (choose one and be consistent):
- `accessToken` — short-lived (1 hour default), send as `Authorization: Bearer <token>`
- `refreshToken` — long-lived (24 hours default), used only to get a new access token

### Request Headers
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## Auth Mutations

### Login
```graphql
mutation Login($loginInput: LoginDto!) {
  login(loginInput: $loginInput) {
    accessToken
    refreshToken
    user {
      id
      fullName
      email
      role
      avatar
      nationalID
      nationality
      createdAt
    }
  }
}
```
Variables:
```json
{
  "loginInput": {
    "email": "user@example.com",
    "password": "StrongPass123!"
  }
}
```

---

### Google Login
```graphql
mutation GoogleLogin($googleTokenInput: GoogleTokenDto!) {
  googleLogin(googleTokenInput: $googleTokenInput) {
    accessToken
    refreshToken
    user {
      id
      fullName
      email
      role
      avatar
    }
  }
}
```
Variables:
```json
{
  "googleTokenInput": {
    "token": "<google_id_token_from_google_sign_in>"
  }
}
```

---

### Refresh Token
```graphql
mutation RefreshToken($refreshTokenInput: RefreshTokenDto!) {
  refreshToken(refreshTokenInput: $refreshTokenInput) {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}
```
Variables:
```json
{
  "refreshTokenInput": {
    "refreshToken": "<your_refresh_token>"
  }
}
```

---

### Register (Customer)
```graphql
mutation CreateUser($userInput: UserDto!) {
  createUser(userInput: $userInput) {
    id
    fullName
    email
    role
    createdAt
  }
}
```
Variables:
```json
{
  "userInput": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "StrongPass123!",
    "nationalID": "1234567890",
    "nationality": "EG",
    "avatar": ""
  }
}
```
> `nationalID`, `nationality`, `avatar` are optional fields despite being in the DTO.

---

### Forgot Password
```graphql
mutation ForgotPassword($forgotPasswordInput: ForgotPasswordDto!) {
  forgotPassword(forgotPasswordInput: $forgotPasswordInput)
}
```
Variables:
```json
{
  "forgotPasswordInput": {
    "email": "user@example.com"
  }
}
```
Returns `true` always (prevents email enumeration).

---

### Reset Password
```graphql
mutation ResetPassword($resetPasswordInput: ResetPasswordDto!) {
  resetPassword(resetPasswordInput: $resetPasswordInput)
}
```
Variables:
```json
{
  "resetPasswordInput": {
    "token": "<token_from_email_link>",
    "newPassword": "NewStrongPass123!"
  }
}
```

---

## Cabin Queries & Mutations

### Get All Cabins (Public — no auth needed)
```graphql
query GetAllCabins {
  getAllCabins {
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
```

### Get Cabin by ID (Public)
```graphql
query GetCabinById($id: Float!) {
  getCabinById(id: $id) {
    id
    name
    maxCapacity
    regularPrice
    discount
    description
    image
  }
}
```

### Create Cabin (Admin only)
```graphql
mutation CreateCabin($cabinInput: CabinDto!) {
  createCabin(cabinInput: $cabinInput) {
    id
    name
    maxCapacity
    regularPrice
    discount
    description
    image
  }
}
```
Variables:
```json
{
  "cabinInput": {
    "name": "Cabin 001",
    "maxCapacity": 4,
    "regularPrice": 250,
    "discount": 20,
    "description": "A cozy mountain cabin.",
    "image": "https://example.com/cabin.jpg"
  }
}
```

### Update Cabin (Admin only)
```graphql
mutation UpdateCabin($id: Float!, $cabinUpdate: CabinUpdateDto!) {
  updateCabin(id: $id, cabinUpdate: $cabinUpdate) {
    id
    name
    regularPrice
    discount
  }
}
```
Variables:
```json
{
  "id": 1,
  "cabinUpdate": {
    "regularPrice": 300,
    "discount": 30
  }
}
```

### Delete Cabin (Admin only)
```graphql
mutation DeleteCabin($id: Float!) {
  deleteCabin(id: $id)
}
```

---

## Booking Queries & Mutations

### Get My Bookings (Logged-in user)
```graphql
query GetMyBookings {
  getMyBookings {
    id
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
    }
    createdAt
  }
}
```

### Get All Bookings (Admin only)
```graphql
query GetAllBookings {
  getAllBookings {
    id
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
    }
    guest {
      id
      fullName
      email
    }
    createdAt
  }
}
```

### Get Booking by ID (Admin only)
```graphql
query GetBookingById($id: Float!) {
  getBookingById(id: $id) {
    id
    startDate
    endDate
    status
    totalPrice
    cabin {
      name
    }
    guest {
      fullName
      email
    }
  }
}
```

### Create Booking (Logged-in user)
```graphql
mutation CreateBooking($bookingInput: BookingDto!) {
  createBooking(bookingInput: $bookingInput) {
    id
    startDate
    endDate
    numNights
    numGuests
    totalPrice
    status
    cabin {
      name
    }
  }
}
```
Variables:
```json
{
  "bookingInput": {
    "startDate": "2025-08-01T00:00:00.000Z",
    "endDate": "2025-08-05T00:00:00.000Z",
    "numNights": 4,
    "numGuests": 2,
    "extrasPrice": 0,
    "hasBreakfast": false,
    "isPaid": false,
    "cabinId": 1,
    "guestId": 7
  }
}
```

> `guestId` is **required** - send the logged-in user's ID from your frontend auth state (for example, `session.user.id` from NextAuth). The backend no longer reads it from the JWT token.

### Update Booking (Admin only)
```graphql
mutation UpdateBooking($id: Float!, $bookingUpdate: BookingUpdateDto!) {
  updateBooking(id: $id, bookingUpdate: $bookingUpdate) {
    id
    status
    isPaid
    totalPrice
  }
}
```
Variables:
```json
{
  "id": 1,
  "bookingUpdate": {
    "status": "CHECKED_IN",
    "isPaid": true
  }
}
```

### Delete Booking (Admin only)
```graphql
mutation DeleteBooking($id: Float!) {
  deleteBooking(id: $id)
}
```

---

## Settings Queries & Mutations

### Get Settings (Public)
```graphql
query GetSettings {
  getSettings {
    id
    minBookingLength
    maxBookingLength
    maxGuestsPerBooking
    breakfastPrice
    updatedAt
  }
}
```

### Create Settings (Admin only — run once)
```graphql
mutation CreateSettings($settingsInput: SettingsDto!) {
  createSettings(settingsInput: $settingsInput) {
    id
    minBookingLength
    maxBookingLength
    maxGuestsPerBooking
    breakfastPrice
  }
}
```
Variables:
```json
{
  "settingsInput": {
    "minBookingLength": 1,
    "maxBookingLength": 30,
    "maxGuestsPerBooking": 8,
    "breakfastPrice": 15
  }
}
```

### Update Settings (Admin only)
```graphql
mutation UpdateSettings($settingsInput: SettingsDto!) {
  updateSettings(settingsInput: $settingsInput) {
    minBookingLength
    maxBookingLength
    maxGuestsPerBooking
    breakfastPrice
    updatedAt
  }
}
```

---

## User Management (Admin only)

### Get All Customers
```graphql
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
```

### Find User by Email
```graphql
query FindOneByEmail($email: String!) {
  findOneByEmail(email: $email) {
    id
    fullName
    email
    role
    createdAt
  }
}
```

### Create Admin User (Admin only)
```graphql
mutation CreateAdminUser($userInput: UserDto!) {
  createAdminUser(userInput: $userInput) {
    id
    fullName
    email
    role
  }
}
```

---

## Enums Reference

### BookingStatus
```
UNCONFIRMED   → newly created
CHECKED_IN    → guest arrived
CHECKED_OUT   → guest left
```

### UserRole
```
CUSTOMER  → regular user, can book cabins
ADMIN     → full access to dashboard
```

---

## Frontend Integration Checklist

### Main Booking Site (Customer-facing)

- [ ] **Auth pages:** Login, Register, Forgot Password, Reset Password
- [ ] **Google Sign-In:** Use `@react-oauth/google` — get `credential` (id_token) → send to `googleLogin` mutation
- [ ] **Token management:** Store `accessToken` + `refreshToken`, auto-refresh using `refreshToken` mutation when 401 received
- [ ] **Cabin listing page:** `getAllCabins` query — show name, image, price, capacity, discount
- [ ] **Cabin detail page:** `getCabinById` — show full details + booking form
- [ ] **Booking form:** Validate dates, numNights, numGuests against settings from `getSettings`
- [ ] **My bookings page:** `getMyBookings` — show status, dates, cabin, total price
- [ ] **Settings-aware validation:** Fetch `getSettings` on app load, use `minBookingLength`, `maxBookingLength`, `maxGuestsPerBooking` to validate booking form

### Admin Dashboard

- [ ] **Dashboard stats:** Aggregate from `getAllBookings` (filter by status, dates)
- [ ] **Bookings table:** `getAllBookings` — sortable, filterable by status/date
- [ ] **Booking detail:** `getBookingById` — check-in / check-out actions via `updateBooking`
- [ ] **Check-in flow:** `updateBooking` with `status: CHECKED_IN`, `isPaid: true`
- [ ] **Check-out flow:** `updateBooking` with `status: CHECKED_OUT`
- [ ] **Cabins management:** CRUD via `createCabin`, `updateCabin`, `deleteCabin`
- [ ] **Users list:** `getAllCustomers`
- [ ] **Settings page:** `getSettings` + `updateSettings`
- [ ] **Role guard on frontend:** Check `user.role === 'admin'` before showing dashboard routes

---

## Recommended GraphQL Client Setup (Apollo Client)

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL + '/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
    // Call refreshToken mutation here, update localStorage, retry
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

---

## Error Handling

The backend formats all errors as:
```json
{
  "errors": [
    {
      "message": "Human-readable error message",
      "extensions": {
        "code": "BAD_REQUEST",
        "status": 400
      }
    }
  ]
}
```

Common status codes:
- `400` — Bad input (validation failed, token expired, settings conflict)
- `401` — Not authenticated
- `403` — Forbidden (wrong role)
- `404` — Resource not found
- `500` — Internal server error

---

## Notes for Cursor

1. All mutations that modify data require `Authorization: Bearer <token>` header
2. `getAllCabins` and `getCabinById` are `@Public()` — no auth needed
3. `createUser` (register) is `@Public()` — no auth needed
4. `forgotPassword` and `resetPassword` are `@Public()`
5. `getSettings` is accessible without auth (used on booking form)
6. Date fields (`startDate`, `endDate`) must be ISO8601 strings: `"2025-08-01T00:00:00.000Z"`
7. `id` fields in queries use `Float!` in the schema (GraphQL convention for NestJS auto-schema)
8. The `hello` query returns a string — useful for connection testing
9. Image fields expect a URL string — handle file uploads separately (e.g., Cloudinary) and pass the URL
