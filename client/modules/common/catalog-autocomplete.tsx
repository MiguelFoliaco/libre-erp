import { useEffect, useId, useState } from "react";
import { Search, X } from "lucide-react";
import { apiClient, type CatalogOption, type CatalogResource } from "@/lib/sdk";

interface CatalogAutocompleteProps {
  resource: CatalogResource;
  value: CatalogOption | null;
  onChange: (value: CatalogOption | null) => void;
  label: string;
  placeholder: string;
  tooShort: string;
  noResults: string;
  loadFailed: string;
  disabled?: boolean;
}

export function CatalogAutocomplete({
  resource,
  value,
  onChange,
  label,
  placeholder,
  tooShort,
  noResults,
  loadFailed,
  disabled = false,
}: CatalogAutocompleteProps) {
  const inputId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value?.id, value?.name]);

  useEffect(() => {
    const searchValue = query.trim();
    if (searchValue.length < 2 || value?.name === searchValue) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setResults([]);
    setLoading(true);
    setFailed(false);
    const timeout = setTimeout(() => {
      apiClient
        .searchCatalog(resource, searchValue, controller.signal)
        .then(setResults)
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          if (controller.signal.aborted) return;
          setResults([]);
          setFailed(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, resource, value?.name]);

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="label py-0 text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <div className="input input-sm flex w-full items-center gap-2 bg-base-200/35">
          <Search size={14} className="shrink-0 text-base-content/45" />
          <input
            id={inputId}
            className="min-w-0 flex-1"
            autoComplete="off"
            disabled={disabled}
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setResults([]);
              setFailed(false);
              if (value) onChange(null);
            }}
          />
          {loading && <span className="loading loading-spinner loading-xs" />}
          {query && !disabled && (
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              aria-label={`${label}: ${query}`}
              onClick={() => {
                setQuery("");
                setResults([]);
                onChange(null);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className="mt-1 text-xs text-base-content/50">{tooShort}</p>
        )}
        {failed && <p role="alert" className="mt-1 text-xs text-error">{loadFailed}</p>}
        {!failed && !loading && query.trim().length >= 2 && results.length === 0 && value === null && (
          <p className="mt-1 text-xs text-base-content/50">{noResults}</p>
        )}
        {results.length > 0 && value === null && (
          <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-sm border border-base-300 bg-base-100 shadow-lg">
            {results.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200"
                  onClick={() => {
                    setQuery(option.name);
                    setResults([]);
                    onChange(option);
                  }}
                >
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
