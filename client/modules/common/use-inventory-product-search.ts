import { useEffect, useState } from 'react';
import { apiClient, type InventoryProductOption } from '@/lib/sdk';

export function useInventoryProductSearch(
  selectedProduct: InventoryProductOption | null,
  onChange: (product: InventoryProductOption | null) => void,
) {
  const [query, setQuery] = useState(selectedProduct?.name ?? '');
  const [results, setResults] = useState<InventoryProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setQuery(selectedProduct?.name ?? '');
  }, [selectedProduct?.id, selectedProduct?.name]);

  useEffect(() => {
    const searchValue = query.trim();
    if (searchValue.length < 2 || selectedProduct) {
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
        .searchInventoryProducts(searchValue, controller.signal)
        .then((result) => setResults(result.items))
        .catch(() => {
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
  }, [query, selectedProduct]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setResults([]);
    setFailed(false);
    if (selectedProduct) onChange(null);
  }

  function selectProduct(product: InventoryProductOption) {
    setQuery(product.name);
    setResults([]);
    onChange(product);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setFailed(false);
    onChange(null);
  }

  return { query, results, loading, failed, updateQuery, selectProduct, clear };
}