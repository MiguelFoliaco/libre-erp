import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiClient, type InventorySupplierRecord } from '@/lib/sdk';
import { errorMessage, type PersonOption, type WarehouseRecord } from '../types';
import { type AddressValues, type AddressField } from '@/config';
import { getAddressStr } from '@/modules/common/utils/get-address';
import { useToast } from '@/modules/common/toast';

const initialAddressValue: AddressValues = {
    administrativeAreaLevel1: '',
    administrativeAreaLevel2: '',
    country: '',
    locality: '',
    postalCode: '',
    neighborhood: '',
    route: '',
    streetNumber: '',
    subpremise: ''
}

export const usePageWarehouse = () => {

    const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
    const [addressValue, setAddressValue] = useState<AddressValues>(initialAddressValue)
    const [suppliers, setSuppliers] = useState<InventorySupplierRecord[]>([]);
    const [supplierSearchResults, setSupplierSearchResults] = useState<InventorySupplierRecord[] | null>(null);
    const [people, setPeople] = useState<PersonOption[]>([]);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [warehouseType, setWarehouseType] = useState<WarehouseRecord['warehouse_type']>('standard');
    const [personId, setPersonId] = useState('');
    const [supplierCode, setSupplierCode] = useState('');
    const [supplierQuery, setSupplierQuery] = useState('');
    const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');
    const { notify } = useToast()

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [warehouseResult, supplierResult, peopleResult] = await Promise.all([
                apiClient.list<WarehouseRecord>('warehouses', { limit: 200 }),
                apiClient.inventorySuppliers(),
                apiClient.inventoryPeople(),
            ]);
            setWarehouses(warehouseResult.items);
            setSuppliers(supplierResult.items);
            setPeople(peopleResult.items);
        } catch (cause) {
            setError(errorMessage(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        const query = supplierQuery.trim();
        if (!query) {
            setSupplierSearchResults(null);
            setSupplierSearchLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            setSupplierSearchLoading(true);
            setError('');
            void apiClient.searchInventorySuppliers(query, controller.signal)
                .then((result) => setSupplierSearchResults(result.items))
                .catch((cause) => {
                    if (!controller.signal.aborted) setError(errorMessage(cause));
                })
                .finally(() => {
                    if (!controller.signal.aborted) setSupplierSearchLoading(false);
                });
        }, 250);
        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [supplierQuery]);

    async function createWarehouse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await apiClient.create('warehouses', {
                name: name.trim(),
                code: code.trim() || null,
                warehouse_type: warehouseType,
                address: addressValue,
                address_str: getAddressStr(addressValue),
                address_fields: Object.keys(addressValue)
            });
            setName('');
            setCode('');
            await loadData();
        } catch (cause) {
            setError(errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    async function createSupplier(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!personId) return;
        setSaving(true);
        setError('');
        try {
            await apiClient.create('suppliers', {
                personId,
                supplierCode: supplierCode.trim() || null,
            });
            setPersonId('');
            setSupplierCode('');
            setSupplierQuery('');
            setSupplierSearchResults(null);
            await loadData();
        } catch (cause) {
            setError(errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    async function toggleWarehouse(warehouse: WarehouseRecord) {
        setBusyId(warehouse.id);
        setError('');
        try {
            await apiClient.update('warehouses', warehouse.id, {
                is_active: !warehouse.is_active,
            });
            await loadData();
        } catch (cause) {
            setError(errorMessage(cause));
        } finally {
            setBusyId('');
        }
    }

    async function toggleSupplier(supplier: InventorySupplierRecord) {
        setBusyId(supplier.id);
        setError('');
        try {
            await apiClient.update('suppliers', supplier.id, {
                is_active: !supplier.is_active,
            });
            await loadData();
        } catch (cause) {
            setError(errorMessage(cause));
        } finally {
            setBusyId('');
        }
    }

    const copy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        notify('success', 'Copied to clipboard');
    }

    const assignedPeople = new Set(suppliers.map((supplier) => supplier.person_id));


    return {
        copy,
        warehouses,
        suppliers,
        supplierSearchResults,
        supplierSearchLoading,
        supplierQuery,
        setSupplierQuery,
        people,
        name,
        code,
        warehouseType,
        personId,
        supplierCode,
        loading,
        saving,
        busyId,
        error,
        loadData,
        createWarehouse,
        createSupplier,
        toggleWarehouse,
        toggleSupplier,
        assignedPeople,
        setName,
        setCode,
        setWarehouseType,
        setPersonId,
        setSupplierCode,
        addressValue,
        setAddressValue
    }
};