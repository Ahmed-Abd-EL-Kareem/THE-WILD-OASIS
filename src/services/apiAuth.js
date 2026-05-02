import { uploadImageToCloudinary } from "./cloudinary";
import {
  clearTokens,
  getStoredUser,
  graphqlRequest,
  storeTokens,
  storeUser,
} from "./graphqlClient";

function normalizeAuthPayload(payload) {
  const user = payload?.user || null;

  if (payload?.accessToken || payload?.refreshToken) {
    storeTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  }

  if (user) storeUser(user);
  return { user, accessToken: payload?.accessToken, refreshToken: payload?.refreshToken };
}

async function findUserByEmail(email) {
  const data = await graphqlRequest(
    `
      query FindOneByEmail($email: String!) {
        findOneByEmail(email: $email) {
          id
          email
        }
      }
    `,
    { email },
    ""
  );

  return data?.findOneByEmail || null;
}

export async function signup({
  fullName,
  email,
  password,
  nationalID,
  nationality,
}) {
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }
  } catch (error) {
    // Some deployments may protect this query. Ignore only auth/permission failures.
    const message = error?.message || "";
    const isPermissionError =
      message.toLowerCase().includes("forbidden") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("permission");

    if (!isPermissionError) throw error;
  }

  try {
    const data = await graphqlRequest(
      `
        mutation CreateUser($userInput: UserDto!) {
          createUser(userInput: $userInput) {
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
      `,
      {
        userInput: {
          fullName,
          email,
          password,
          nationalID,
          nationality,
          // avatar: "",
        },
      },
      ""
    );
    return { user: data.createUser };
  } catch (error) {
    const message = error?.message || "";
    if (message.includes('duplicate key value violates unique constraint "PK_cace4a159ff9f2512dd42373760"')) {
      throw new Error(
        "User creation failed due to a backend primary-key conflict. This email may already be registered in the auth provider. Try another email or remove the existing auth user on the backend."
      );
    }

    throw error;
  }
}

export async function createAdminUser({
  fullName,
  email,
  password,
  nationalID,
  nationality,
}) {
  const data = await graphqlRequest(
    `
      mutation CreateAdminUser($userInput: UserDto!) {
        createAdminUser(userInput: $userInput) {
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
    `,
    {
      userInput: {
        fullName,
        email,
        password,
        nationalID,
        nationality,
        // avatar: "",
      },
    }
  );

  return { user: data.createAdminUser };
}

export async function googleSignin(token) {
  if (!token) {
    throw new Error("Google token is required. Wire @react-oauth/google credential to googleSignin(token).");
  }

  const data = await graphqlRequest(
    `
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
            nationalID
            nationality
            createdAt
          }
        }
      }
    `,
    { googleTokenInput: { token } },
    ""
  );

  return normalizeAuthPayload(data.googleLogin);
}

export async function login({ email, password }) {
  const data = await graphqlRequest(
    `
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
    `,
    { loginInput: { email, password } },
    ""
  );

  return normalizeAuthPayload(data.login);
}

export async function getCurrentUser() {
  return getStoredUser();
}

export async function logout() {
  clearTokens();
}

export async function updateCurrentUser({ fullName, password, avatar }) {
  const currentUser = getStoredUser();
  if (!currentUser) throw new Error("No active user session");

  const avatarUrl =
    typeof avatar === "string"
      ? avatar
      : avatar
      ? await uploadImageToCloudinary(avatar)
      : currentUser.avatar || "";

  const nationalID = currentUser.nationalID || "";
  const nationality = currentUser.nationality || "";

  // Backend guide exposes user updates through createUser/createAdminUser only.
  // Keep UX intact by updating local persisted profile until a dedicated updateUser mutation exists.
  const updatedUser = {
    ...currentUser,
    fullName: fullName || currentUser.fullName,
    avatar: avatarUrl,
    nationalID,
    nationality,
  };

  storeUser(updatedUser);

  if (password) {
    // Password update mutation is not exposed in the integration guide schema.
    console.warn("Password update is not supported by the current backend schema.");
  }

  return { user: updatedUser };
}
