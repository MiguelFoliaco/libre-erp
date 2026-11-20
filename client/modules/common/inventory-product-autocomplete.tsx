import { useId, useState, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import type { InventoryProductOption } from '@/lib/sdk';
import { useInventoryProductSearch } from './use-inventory-product-search';

interface InventoryProductAutocompleteProps {
  value: InventoryProductOption | null;
  onChange: (product: InventoryProductOption | null) => void;
  disabled?: boolean;
}

export function InventoryProductAutocomplete({
  value,
  onChange,
  disabled = false,
}: InventoryProductAutocompleteProps) {
  const inputId = useId();
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const { query, results, loading, failed, updateQuery, selectProduct, clear } =
    useInventoryProductSearch(value, onChange);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectProduct(results[activeIndex]);
      setActiveIndex(-1);
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      selectProduct(results[0]);
    } else if (event.key === 'Escape') {
      setActiveIndex(-1);
    }
  }

  return (
    <div className="form-control relative">
      <label htmlFor={inputId} className="label py-0">
        <span className="label-text mb-1 text-xs">Producto *</span>
      </label>
      <div className="input input-bordered input-sm flex w-full items-center gap-2">
        <Search size={14} className="shrink-0 text-base-content/45" />
        <input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={results.length > 0}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-required="true"
          className="min-w-0 flex-1"
          autoComplete="off"
          disabled={disabled}
          maxLength={100}
          placeholder="Buscar por nombre, SKU o código de barras"
          value={query}
          onChange={(event) => {
            updateQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {loading && <span className="loading loading-spinner loading-xs" />}
        {query && !disabled && (
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Limpiar producto"
            onClick={() => {
              clear();
              setActiveIndex(-1);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-1 text-xs text-base-content/50">Escribe al menos 2 caracteres.</p>
      )}
      {failed && <p role="alert" className="mt-1 text-xs text-error">No se pudo buscar productos.</p>}
      {!failed && !loading && query.trim().length >= 2 && results.length === 0 && !value && (
        <p className="mt-1 text-xs text-base-content/50">No se encontraron productos.</p>
      )}
      {results.length > 0 && !value && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-base-300 bg-base-100 shadow-lg"
        >
          {results.map((product, index) => (
            <li key={product.id} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-base-200 ${index === activeIndex ? 'bg-base-200' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  selectProduct(product);
                  setActiveIndex(-1);
                }}
              >
                <span className="min-w-0 truncate">{product.name}</span>
                {product.sku && <span className="shrink-0 text-xs text-base-content/55">{product.sku}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}