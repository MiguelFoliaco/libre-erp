import { useState,  type FormEvent } from "react";
import Papa from "papaparse";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import {
  apiClient,
  type CatalogOption,
} from "@/lib/sdk";
import { CSVTableProduct, isRecord } from './csv/csv-table'
import { CatalogAutocomplete } from "@/modules/common/catalog-autocomplete";
import { useToast } from "@/modules/common/toast";
import { text } from "@/modules/language";

type ProductType = "physical" | "virtual" | "service";
type CreationMode = "individual" | "csv";

const primaryColor = 'bg-linear-to-tr from-blue-500 to-120% to-cyan-400'



export function ProductCreatePage() {
  const { notify } = useToast();
  const [mode, setMode] = useState<CreationMode>("individual");
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [brand, setBrand] = useState<CatalogOption | null>(null);
  const [category, setCategory] = useState<CatalogOption | null>(null);
  const [department, setDepartment] = useState<CatalogOption | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState<ProductType>("physical");
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [currencyCode, setCurrencyCode] = useState("");
  const [unit, setUnit] = useState("unit");
  const [metadata, setMetadata] = useState("{}");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");


  const autocompleteProps = {
    tooShort: text("modules.products.autocomplete.tooShort"),
    noResults: text("modules.products.autocomplete.noResults"),
    loadFailed: text("modules.products.autocomplete.loadFailed"),
  };

  function resetProductForm() {
    setName("");
    setSku("");
    setBarcode("");
    setDescription("");
    setProductType("physical");
    setCostPrice("0");
    setSalePrice("0");
    setCurrencyCode("");
    setUnit("unit");
    setMetadata("{}");
    setIsActive(true);
    setBrand(null);
    setCategory(null);
    setDepartment(null);
    setFormError("");
    setFormKey((key) => key + 1);
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    let parsedMetadata: unknown;
    try {
      parsedMetadata = JSON.parse(metadata) as unknown;
    } catch {
      setFormError(text("modules.products.messages.invalidMetadata"));
      return;
    }
    if (!isRecord(parsedMetadata)) {
      setFormError(text("modules.products.messages.invalidMetadata"));
      return;
    }

    setSaving(true);
    try {
      await apiClient.create("products", {
        brand_id: brand?.id ?? null,
        category_id: category?.id ?? null,
        department_id: department?.id ?? null,
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        name: name.trim(),
        description: description.trim() || null,
        product_type: productType,
        cost_price: costPrice,
        sale_price: salePrice,
        currency_code: currencyCode.trim().toUpperCase(),
        unit: unit.trim(),
        metadata: parsedMetadata,
        is_active: isActive,
      });
      notify("success", text("modules.products.messages.created"));
      resetProductForm();
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : text("modules.products.messages.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  }



  return (
    <div className="min-h-full bg-base-200/50 pb-8">
      <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
        <span className="flex size-9 items-center justify-center rounded-sm bg-blue-500/10 text-blue-700">
          <Plus size={19} />
        </span>
        <div>
          <span className="text-sm font-semibold text-base-content/80">{text("modules.products.navigation.create")}</span>
          <p className="text-xs text-base-content/50">{text("modules.products.create.description")}</p>
        </div>
      </header>

      <main className="mx-auto max-w-[90%] space-y-4 p-4 sm:p-6">
        <div role="tablist" className="tabs tabs-boxed w-fit">
          <button role="tab" type="button" className={clsx("tab", mode === "individual" && "tab-active")} onClick={() => setMode("individual")}>
            {text("modules.products.create.individual")}
          </button>
          <button role="tab" type="button" className={clsx("tab", mode === "csv" && "tab-active")} onClick={() => setMode("csv")}>
            {text("modules.products.create.csv")}
          </button>
        </div>

        {mode === "individual" ? (
          <section className="rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
            <h1 className="text-lg font-semibold">{text("modules.products.create.individualTitle")}</h1>
            <p className="mb-5 mt-1 text-sm text-base-content/55">{text("modules.products.create.scopeNotice")}</p>
            <form key={formKey} className="space-y-5" onSubmit={(event) => void submitProduct(event)}>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1 sm:col-span-2">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.name")} *</span>
                  <input className="input input-sm w-full bg-base-200/35" value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} />
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.sku")}</span>
                  <input className="input input-sm w-full bg-base-200/35" value={sku} onChange={(event) => setSku(event.target.value)} maxLength={100} />
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.barcode")}</span>
                  <input className="input input-sm w-full bg-base-200/35" value={barcode} onChange={(event) => setBarcode(event.target.value)} maxLength={100} />
                </label>
                <CatalogAutocomplete key={`brand-${formKey}`} resource="brands" value={brand} onChange={setBrand} label={text("modules.products.fields.brand")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
                <CatalogAutocomplete key={`category-${formKey}`} resource="categories" value={category} onChange={setCategory} label={text("modules.products.fields.category")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
                <CatalogAutocomplete key={`department-${formKey}`} resource="departments" value={department} onChange={setDepartment} label={text("modules.products.fields.department")} placeholder={text("modules.products.autocomplete.placeholder")} {...autocompleteProps} />
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.productType")}</span>
                  <select className="select select-sm w-full bg-base-200" value={productType} onChange={(event) => setProductType(event.target.value as ProductType)}>
                    <option value="physical">{text("modules.products.types.physical")}</option>
                    <option value="virtual">{text("modules.products.types.virtual")}</option>
                    <option value="service">{text("modules.products.types.service")}</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.costPrice")}</span>
                  <input className="input input-sm w-full bg-base-200/35" type="number" min="0" step="0.000001" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} required />
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.salePrice")}</span>
                  <input className="input input-sm w-full bg-base-200/35" type="number" min="0" step="0.000001" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} required />
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.currencyCode")} *</span>
                  <input className="input input-sm w-full bg-base-200/35 uppercase" value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" placeholder="USD" />
                </label>
                <label className="space-y-1">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.unit")}</span>
                  <input className="input input-sm w-full bg-base-200/35" value={unit} onChange={(event) => setUnit(event.target.value)} required maxLength={30} />
                </label>
                <label className="space-y-1 sm:col-span-3">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.description")}</span>
                  <textarea className="textarea textarea-sm resize-none w-full bg-base-200/35" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
                </label>
                <label className="space-y-1 sm:col-span-3">
                  <span className="label py-0 text-xs font-medium">{text("modules.products.fields.metadata")}</span>
                  <textarea className="textarea textarea-sm w-full resize-none font-mono bg-base-200/35" value={metadata} onChange={(event) => setMetadata(event.target.value)} rows={3} />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                  {text("modules.products.status.active")}
                </label>
              </div>
              {formError && <p role="alert" className="text-sm text-error">{formError}</p>}
              <div className="flex justify-end border-t border-base-300 pt-4">
                <button className={
                  clsx(
                    "btn btn-info btn-sm text-white",
                    primaryColor
                  )
                } type="submit" disabled={saving}>
                  {saving ? <span className="loading loading-spinner loading-xs" /> : <Plus size={15} />}
                  {text("modules.products.create.save")}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <CSVTableProduct />
        )}
      </main>
    </div>
  );
}
