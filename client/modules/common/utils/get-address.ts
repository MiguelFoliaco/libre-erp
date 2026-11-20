import type { AddressValues } from '@/config';

export const getAddressStr = (address: AddressValues) => {
    return Object.values(address).join(", ");
}