const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL;

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/** Single in-flight refresh so parallel requests await one mutation. */
let refreshInFlight = null;

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

/** Read JWT exp (ms); null if unreadable — browser-safe. */
function getJwtExpiryMs(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  const [, seg] = accessToken.split(".");
  if (!seg) return null;
  try {
    const base64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = JSON.parse(atob(padded));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
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

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { response, payload };
}

/**
 * Matches integration guide RefreshToken mutation; merges partial `user`
 * onto stored profile when the API returns only `{ id email role }`.
 */
async function runRefreshMutation() {
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
            email
            role
          }
        }
      }
    `,
    { refreshTokenInput: { refreshToken } },
    null
  );

  if (!response.ok || payload?.errors?.length || !payload?.data?.refreshToken) {
    clearTokens();
    return null;
  }

  const authPayload = payload.data.refreshToken;
  storeTokens(authPayload);
  if (authPayload.user) {
    storeUser({ ...(getStoredUser() || {}), ...authPayload.user });
  }
  return authPayload.accessToken;
}

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = runRefreshMutation().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function isUnauthorized(response, payload) {
  if (response?.status === 401) return true;

  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors.some((e) => {
    const st = e?.extensions?.status;
    const code = String(e?.extensions?.code || "");
    return st === 401 || code === "UNAUTHENTICATED";
  });
}

/**
 * @param {string} [explicitToken] — Omit to send stored access token & enable refresh (+ proactive renew).
 * Pass `''`/`null` for public calls without Authorization (refresh disabled).
 */
export async function graphqlRequest(query, variables = {}, explicitToken) {
  /** Use stored token only when caller omits arg (undefined). */
  const authFromStored = explicitToken === undefined;

  async function resolveAccessTokenForRequest() {
    if (!authFromStored) {
      return explicitToken || null;
    }
    let at = getStoredTokens().accessToken;
    const rt = getStoredTokens().refreshToken;
    if (!at) return null;
    if (!rt) return at;

    const expMs = getJwtExpiryMs(at);
    if (expMs != null && Date.now() >= expMs - 60_000) {
      const renewed = await refreshSession();
      at = renewed ?? getStoredTokens().accessToken;
    }
    return at || null;
  }

  let initialToken = authFromStored ? await resolveAccessTokenForRequest() : explicitToken || null;
  let { response, payload } = await executeRequest(query, variables, initialToken);

  if (authFromStored && getStoredTokens().refreshToken && isUnauthorized(response, payload)) {
    const renewedToken = await refreshSession();
    if (renewedToken) {
      initialToken = renewedToken;
      const retried = await executeRequest(query, variables, renewedToken);
      response = retried.response;
      payload = retried.payload;
    }
  }

  if (!response.ok || payload?.errors?.length) {
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
      data: payload?.data ?? null,
      rawPayload: payload,
    });

    throw new Error(message);
  }

  return payload.data;
}
