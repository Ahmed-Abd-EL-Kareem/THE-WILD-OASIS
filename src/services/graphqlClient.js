const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ||
  "https://cabins-nest-js-back-end-production.up.railway.app/graphql";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(tokens = {}) {
  const { accessToken, refreshToken } = tokens;

  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("currentUser");
}

export function getStoredUser() {
  const userRaw = localStorage.getItem("currentUser");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (!user) return;
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function sanitizeVariables(value) {
  if (Array.isArray(value)) return value.map(sanitizeVariables);
  if (!value || typeof value !== "object") return value;

  const redactedKeys = new Set(["password", "token", "accessToken", "refreshToken"]);
  const sanitized = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    sanitized[key] = redactedKeys.has(key) ? "[REDACTED]" : sanitizeVariables(nestedValue);
  }

  return sanitized;
}

async function executeRequest(query, variables, accessToken) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  return { response, payload };
}

async function refreshSession() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  const { response, payload } = await executeRequest(
    `
      mutation RefreshToken($refreshTokenInput: RefreshTokenDto!) {
        refreshToken(refreshTokenInput: $refreshTokenInput) {
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
    { refreshTokenInput: { refreshToken } },
    ""
  );

  if (!response.ok || payload?.errors?.length || !payload?.data?.refreshToken) {
    clearTokens();
    return null;
  }

  const authPayload = payload.data.refreshToken;
  storeTokens(authPayload);
  if (authPayload.user) storeUser(authPayload.user);
  return authPayload.accessToken;
}

function isUnauthorized(response, payload) {
  if (response.status === 401) return true;
  return payload?.errors?.some((error) => error?.extensions?.status === 401);
}

export async function graphqlRequest(query, variables = {}, token) {
  const initialToken = token ?? getStoredTokens().accessToken;
  let { response, payload } = await executeRequest(query, variables, initialToken);

  if (!token && isUnauthorized(response, payload)) {
    const renewedToken = await refreshSession();
    if (renewedToken) {
      const retried = await executeRequest(query, variables, renewedToken);
      response = retried.response;
      payload = retried.payload;
    }
  }

  if (!response.ok || payload.errors?.length) {
    const firstError = payload?.errors?.[0];
    const message = firstError?.message || "GraphQL request failed unexpectedly";

    console.error("GraphQL request failed", {
      url: GRAPHQL_URL,
      status: response.status,
      statusText: response.statusText,
      hasAuthHeader: Boolean(initialToken),
      operation: query,
      variables: sanitizeVariables(variables),
      errors: payload?.errors || [],
      firstError,
      data: payload?.data || null,
      rawPayload: payload,
    });

    throw new Error(message);
  }

  return payload.data;
}
