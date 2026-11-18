import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { apiClient, type CatalogOption, type ProductSearchFilters, type ProductSearchResult } from "../../../lib/sdk";
import { CatalogAutocomplete } from "../../common/catalog-autocomplete";
import { Table } from "../../common/table";
import { useToast } from "../../common/toast";
import { text } from "../../language";
import { formatCurrency } from '../../common/utils/parse-value-currency';

const PAGE_SIZE = 50;
type ProductType = NonNullable<ProductSearchFilters["product_type"]>;

function productTypeLabel(value: unknown): string {
  if (value === "physical") return text("modules.products.types.physical");
  if (value === "virtual") return text("modules.products.types.virtual");
  if (value === "service") return text("modules.products.types.service");
  return "—";
}

export function ProductSearchPage() {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<CatalogOption | null>(null);
  const [category, setCategory] = useState<CatalogOption | null>(null);
  const [department, setDepartment] = useState<CatalogOption | null>(null);
  const [productType, setProductType] = useState<ProductType | "">("");
  const [active, setActive] = useState<"true" | "false" | "">("true");
  const [salePriceMin, setSalePriceMin] = useState("");
  const [salePriceMax, setSalePriceMax] = useState("");
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<ProductSearchFilters>({
    is_active: true,
  });

  const loadProducts = useCallback(async (nextOffset: number) => {
    setLoading(true);
    try {
      const result = await apiClient.searchProducts({
        ...appliedFilters,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setProducts(result.items);
      setOffset(result.offset);
    } catch (cause) {
      notify(
        "error",
        cause instanceof Error
          ? cause.message
          : text("modules.products.messages.searchFailed"),
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, notify]);

  useEffect(() => {
    void loadProducts(0);
  }, [loadProducts]);

  function applyFilters() {
    setOffset(0);
    setAppliedFilters({
      query: query.trim() || undefined,
      brand_id: brand?.id,
      category_id: category?.id,
      department_id: department?.id,
      product_type: productType || undefined,
      is_active: active === "" ? undefined : active === "true",
      sale_price_min: salePriceMin || undefined,
      sale_price_max: salePriceMax || undefined,
    });
  }

  const autocompleteProps = {
    tooShort: text("modules.products.autocomplete.tooShort"),
    noResults: text("modules.products.autocomplete.noResults"),
    loadFailed: text("modules.products.autocomplete.loadFailed"),
  };

  return (
    <div className="min-h-full bg-base-200/50 pb-8">
      <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
        <span className="flex size-9 items-center justify-center rounded-sm bg-blue-500/10 text-blue-700">
          <Search size={19} />
        </span>
        <div>
          <span className="text-sm font-semibold text-base-content/80">{text("modules.products.navigation.search")}</span>
          <p className="text-xs text-base-content/50">{text("modules.products.search.description")}</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        <section className="rounded-sm border border-base-300 bg-base-100 p-4 shadow-sm">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (query.trim().length === 1) {
                notify("warning", text("modules.products.search.queryTooShort"));
                return;
              }
              applyFilters();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1">
                <span className="label py-0 text-xs font-medium">{text("modules.products.fields.query")}</span>
                <input
                  className="input input-sm w-full bg-base-200/35"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={text("modules.products.search.queryPlaceholder")}
                />
              </label>
              <CatalogAutocomplete resource="brands" value={brand} onChange={setBrand} label={text("modules.products.fields.brand")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
              <CatalogAutocomplete resource="categories" value={category} onChange={setCategory} label={text("modules.products.fields.category")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
              <CatalogAutocomplete resource="departments" value={department} onChange={setDepartment} label={text("modules.products.fields.department")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
              <label className="space-y-1">
                <span className="label py-0 text-xs font-medium">{text("modules.products.fields.productType")}</span>
                <select className="select select-sm w-full bg-base-200/35" value={productType} onChange={(event) => setProductType(event.target.value as ProductType | "")}>
                  <option value="">{text("modules.products.search.allTypes")}</option>
                  <option value="physical">{text("modules.products.types.physical")}</option>
                  <option value="virtual">{text("modules.products.types.virtual")}</option>
                  <option value="service">{text("modules.products.types.service")}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="label py-0 text-xs font-medium">{text("modules.products.fields.status")}</span>
                <select className="select select-sm w-full bg-base-200/35" value={active} onChange={(event) => setActive(event.target.value as "true" | "false" | "")}>
                  <option value="true">{text("modules.products.status.active")}</option>
                  <option value="false">{text("modules.products.status.inactive")}</option>
                  <option value="">{text("modules.products.search.allStatuses")}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="label py-0 text-xs font-medium">{text("modules.products.search.salePriceMin")}</span>
                <input className="input input-sm w-full bg-base-200/35" type="number" min="0" step="0.000001" value={salePriceMin} onChange={(event) => setSalePriceMin(event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="label py-0 text-xs font-medium">{text("modules.products.search.salePriceMax")}</span>
                <input className="input input-sm w-full bg-base-200/35" type="number" min="0" step="0.000001" value={salePriceMax} onChange={(event) => setSalePriceMax(event.target.value)} />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" className={clsx("btn btn-sm border-0 text-white", "bg-linear-to-r from-blue-600 to-cyan-500")} disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-xs" /> : <Search size={15} />}
                {text("modules.products.search.submit")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-sm border border-base-300 bg-base-100 p-3 shadow-sm sm:p-5">
          <Table<ProductSearchResult>
            data={products}
            loading={loading}
            emptyMessage={text("modules.products.search.empty")}
            columns={[
              { key: "sku", label: text("modules.products.fields.sku") },
              { key: "barcode", label: text("modules.products.fields.barcode") },
              { key: "name", label: text("modules.products.fields.name"), className: "min-w-40 font-semibold" },
              { key: "brand_name", label: text("modules.products.fields.brand") },
              { key: "category_name", label: text("modules.products.fields.category") },
              { key: "department_name", label: text("modules.products.fields.department") },
              { key: "product_type", label: text("modules.products.fields.productType"), render: (value) => productTypeLabel(value) },
              { key: "sale_price", label: text("modules.products.fields.salePrice"), render: (_, product) => formatCurrency(product.sale_price) },
              { key: "is_active", label: text("modules.products.fields.status"), render: (value) => <span className={clsx("badge badge-xs border-0", value ? "bg-emerald-500/10 text-emerald-800" : "bg-base-300 text-base-content/60")}>{value ? text("modules.products.status.active") : text("modules.products.status.inactive")}</span> },
            ]}
          />
          <div className="mt-4 flex items-center justify-between border-t border-base-300 pt-3 text-xs text-base-content/55">
            <span>{text("modules.products.search.pageCount", { from: String(products.length ? offset + 1 : 0), to: String(offset + products.length) })}</span>
            <div className="join">
              <button className="join-item btn btn-xs" type="button" disabled={loading || offset === 0} onClick={() => void loadProducts(Math.max(0, offset - PAGE_SIZE))}>{text("modules.products.search.previous")}</button>
              <button className="join-item btn btn-xs" type="button" disabled={loading || products.length < PAGE_SIZE} onClick={() => void loadProducts(offset + PAGE_SIZE)}>{text("modules.products.search.next")}</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
