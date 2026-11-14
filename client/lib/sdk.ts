export const API_RESOURCES = [
  "companies",
  "environments",
  "brands",
  "categories",
  "departments",
  "products",
  "branches",
  "warehouses",
  "inventory",
  "inventory-movements",
  "transfers",
  "transfer-items",
  "document-types-people",
  "people",
  "customer-types",
  "customers",
  "users",
  "sellers",
  "roles",
  "user-roles",
  "document-types",
  "document-type-fields",
  "document-type-headers",
  "document-type-footers",
  "documents",
  "document-items",
  "document-taxes",
  "taxes",
  "product-taxes",
  "audit-logs",
  "accounts",
  "fiscal-periods",
  "journal-entries",
  "journal-entry-lines",
  "cash-registers",
  "cash-sessions",
  "payment-methods",
  "sales",
  "sale-items",
  "sale-item-taxes",
  "sale-payments",
  "cash-movements",
  "sale-returns",
  "sale-return-items",
] as const;

export type ApiResource = (typeof API_RESOURCES)[number];
export type WritableApiResource = Exclude<ApiResource, "audit-logs">;

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  environmentId: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  secondLastName: string | null;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface LoginInput {
  identifier: string;
  password: string;
  companyId?: string;
  environmentId?: string;
}

export interface ListResult<T> {
  items: T[];
  limit: number;
  offset: number;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  authenticated?: boolean;
  retryOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.companyId === "string" &&
    typeof user.environmentId === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    (typeof user.firstName === "string" || user.firstName === null) &&
    (typeof user.lastName === "string" || user.lastName === null) &&
    (typeof user.secondLastName === "string" ||
      user.secondLastName === null)
  );
}

function parseAuthSession(value: unknown): AuthSession {
  if (
    value &&
    typeof value === "object" &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    "expiresIn" in value &&
    typeof value.expiresIn === "number" &&
    value.expiresIn > 0 &&
    "user" in value &&
    isAuthenticatedUser(value.user)
  ) {
    return value as AuthSession;
  }
  throw new ApiError("Respuesta de autenticación inválida", 502, value);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message.join(", ");
    }
  }
  return `Error del servidor (${status})`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(
        `La API devolvió una respuesta JSON inválida (${response.status})`,
        response.status,
        text,
      );
    }
  }
  return text;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private accessToken: string | null = null;
  private refreshInFlight: Promise<AuthSession | null> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ??
        import.meta.env.VITE_API_URL ??
        "http://localhost:3000",
    );
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const payload = await this.send<unknown>("/auth/login", {
      method: "POST",
      body: input,
    });
    return this.setSession(parseAuthSession(payload));
  }

  async refresh(): Promise<AuthSession | null> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.send<unknown>("/auth/refresh", {
        method: "POST",
      })
        .then((payload) => this.setSession(parseAuthSession(payload)))
        .catch((cause: unknown) => {
          if (cause instanceof ApiError && cause.status === 401) {
            this.clearSession();
            return null;
          }
          throw cause;
        })
        .finally(() => {
          this.refreshInFlight = null;
        });
    }
    return this.refreshInFlight;
  }

  restoreSession(): Promise<AuthSession | null> {
    return this.refresh();
  }

  async logout(): Promise<void> {
    await this.send("/auth/logout", {
      method: "POST",
      headers: this.accessToken
        ? { Authorization: `Bearer ${this.accessToken}` }
        : undefined,
    });
    this.clearSession();
  }

  me(): Promise<AuthenticatedUser> {
    return this.request("/auth/me");
  }

  async request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const {
      authenticated = true,
      retryOnUnauthorized = true,
      ...requestOptions
    } = options;
    try {
      return await this.send<T>(path, requestOptions, authenticated);
    } catch (cause) {
      if (
        authenticated &&
        retryOnUnauthorized &&
        this.accessToken &&
        cause instanceof ApiError &&
        cause.status === 401
      ) {
        const session = await this.refresh();
        if (session) {
          return this.request<T>(path, {
            ...options,
            retryOnUnauthorized: false,
          });
        }
      }
      throw cause;
    }
  }

  list<T>(
    resource: ApiResource,
    pagination: { limit?: number; offset?: number } = {},
  ): Promise<ListResult<T>> {
    const query = new URLSearchParams();
    if (pagination.limit !== undefined) {
      query.set("limit", String(pagination.limit));
    }
    if (pagination.offset !== undefined) {
      query.set("offset", String(pagination.offset));
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.request(`api/${resource}${suffix}`);
  }

  get<T>(resource: ApiResource, id: string): Promise<T> {
    return this.request(`api/${resource}/${encodeURIComponent(id)}`);
  }

  create<T>(resource: WritableApiResource, body: unknown): Promise<T> {
    return this.request(`api/${resource}`, { method: "POST", body });
  }

  update<T>(
    resource: WritableApiResource,
    id: string,
    body: unknown,
  ): Promise<T> {
    return this.request(`api/${resource}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
  }

  remove(
    resource: WritableApiResource,
    id: string,
  ): Promise<{ deleted: true }> {
    return this.request(`api/${resource}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  changePassword(
    userId: string,
    passwords: { currentPassword: string; newPassword: string },
  ): Promise<{ success: true }> {
    return this.request(
      `api/users/${encodeURIComponent(userId)}/password`,
      { method: "PATCH", body: passwords },
    );
  }

  inventoryReport<T>(): Promise<T> {
    return this.request("api/reports/inventory");
  }

  salesReport<T>(from?: string, to?: string): Promise<T> {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.request(`api/reports/sales${suffix}`);
  }

  private setSession(session: AuthSession): AuthSession {
    this.accessToken = session.accessToken;
    return session;
  }

  private clearSession(): void {
    this.accessToken = null;
  }

  private async send<T>(
    path: string,
    options: Omit<ApiRequestOptions, "authenticated" | "retryOnUnauthorized">,
    authenticated = false,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (authenticated && this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await this.fetcher(
      `${this.baseUrl}/${path.replace(/^\/+/, "")}`,
      {
        ...options,
        headers,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: "include",
      },
    );
    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new ApiError(
        errorMessage(body, response.status),
        response.status,
        body,
      );
    }
    return body as T;
  }
}

export const apiClient = new ApiClient();