import type { PersonSearchResult } from './user-and-roles';
import type { CustomerSearchResult } from './crm';

export const API_RESOURCES = [
  "companies",
  "environments",
  "brands",
  "categories",
  "departments",
  "products",
  "branches",
  "warehouses",
  "suppliers",
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
  rol_name: string;
  rol_actions: string;
  rol_id: string;
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

export interface CatalogOption {
  id: string;
  name: string;
}

export type CatalogResource = "brands" | "categories" | "departments";

export interface ProductSearchFilters {
  query?: string;
  brand_id?: string;
  category_id?: string;
  department_id?: string;
  product_type?: "physical" | "virtual" | "service";
  is_active?: boolean;
  sale_price_min?: string;
  sale_price_max?: string;
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  id: string;
  company_id: string;
  environment_id: string;
  brand_id: string | null;
  category_id: string | null;
  department_id: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  product_type: "physical" | "virtual" | "service";
  cost_price: string;
  sale_price: string;
  currency_code: string;
  unit: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand_name: string | null;
  category_name: string | null;
  department_name: string | null;
}

export interface InventoryStockRow {
  id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  warehouse_id: string;
  warehouse_name: string;
  quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  updated_at: string;
}

export interface InventoryProductOption {
  id: string;
  name: string;
  sku: string | null;
}

export interface InventoryMovementRow {
  id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  warehouse_id: string;
  warehouse_name: string;
  movement_type:
    | "entry"
    | "exit"
    | "adjustment_in"
    | "adjustment_out"
    | "transfer_in"
    | "transfer_out"
    | "reversal";
  quantity: string;
  reference_type: string | null;
  reference_id: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  transfer_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface InventorySupplierRecord {
  id: string;
  person_id: string;
  supplier_code: string | null;
  is_active: boolean;
  person_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
  document_type_name: string | null;
  document_number: string | null;
  email: string | null;
  phone: string | null;
}

export interface InventoryMovementInput {
  movementType: "entry" | "exit" | "adjustment_in" | "adjustment_out";
  warehouseId: string;
  productId: string;
  quantity: string;
  source?: "supplier" | "return";
  supplierId?: string;
  referenceId?: string;
  notes?: string;
}

export interface InventoryTransferInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: { productId: string; quantity: string }[];
  notes?: string;
}

export interface ProductImportRow {
  row_number: number;
  company_id?: string;
  environment_id?: string;
  brand_id?: string;
  brand_name?: string;
  category_id?: string;
  category_name?: string;
  department_id?: string;
  department_name?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  product_type?: string;
  cost_price?: string;
  sale_price?: string;
  currency_code?: string;
  unit?: string;
  metadata?: string;
  is_active?: string;
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

  searchPeople(query: string, signal?: AbortSignal): Promise<PersonSearchResult[]> {
    const params = new URLSearchParams({ query });
    return this.request(`api/people/search?${params.toString()}`, { signal });
  }

  searchCustomers(query = "", signal?: AbortSignal): Promise<CustomerSearchResult[]> {
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return this.request(`api/customers/search${suffix}`, { signal });
  }

  searchCatalog(
    resource: CatalogResource,
    query: string,
    signal?: AbortSignal,
  ): Promise<CatalogOption[]> {
    const params = new URLSearchParams({ query });
    return this.request(
      `api/catalogs/${resource}/search?${params.toString()}`,
      { signal },
    );
  }

  searchProducts(
    filters: ProductSearchFilters = {},
    signal?: AbortSignal,
  ): Promise<ListResult<ProductSearchResult>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return this.request(`api/products/search${suffix}`, { signal });
  }

  importProducts(rows: ProductImportRow[]): Promise<{ created: number }> {
    return this.request("api/products/import", {
      method: "POST",
      body: { rows },
    });
  }

  inventoryStock(
    filters: { warehouseId?: string; query?: string } = {},
  ): Promise<ListResult<InventoryStockRow>> {
    const params = new URLSearchParams();
    if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
    if (filters.query) params.set("query", filters.query);
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return this.request(`api/inventory/stock${suffix}`);
  }

  inventoryPeople(): Promise<ListResult<{ id: string; name: string }>> {
    return this.request("api/inventory/people");
  }

  inventorySuppliers(
    signal?: AbortSignal,
  ): Promise<ListResult<InventorySupplierRecord>> {
    return this.request("api/inventory/suppliers", { signal });
  }

  searchInventorySuppliers(
    query: string,
    signal?: AbortSignal,
  ): Promise<ListResult<InventorySupplierRecord>> {
    const params = new URLSearchParams({ query });
    return this.request(
      `api/inventory/suppliers/search?${params.toString()}`,
      { signal },
    );
  }

  inventoryProducts(): Promise<
    ListResult<InventoryProductOption>
  > {
    return this.request("api/inventory/products");
  }

  searchInventoryProducts(
    query: string,
    signal?: AbortSignal,
  ): Promise<ListResult<InventoryProductOption>> {
    const params = new URLSearchParams({ query });
    return this.request(
      `api/inventory/products/search?${params.toString()}`,
      { signal },
    );
  }

  inventoryMovements(): Promise<ListResult<InventoryMovementRow>> {
    return this.request("api/inventory/operations");
  }

  createInventoryMovement(
    input: InventoryMovementInput,
  ): Promise<InventoryMovementRow> {
    return this.request("api/inventory/operations", {
      method: "POST",
      body: input,
    });
  }

  createInventoryTransfer(input: InventoryTransferInput): Promise<unknown> {
    return this.request("api/inventory/transfers", {
      method: "POST",
      body: input,
    });
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