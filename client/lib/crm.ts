import { config } from './../config';


export interface People {
    id: string
    company_id: string
    environment_id: string
    first_name: string
    middle_name?: string
    last_name: string
    second_last_name: any
    document_types_people_id: string
    document_number?: string
    email: string
    phone?: string
    birth_date?: string
    address_str?: string
    address_fields: ArrayValues<typeof config['addressConfig']['fields']>[]
    address: Address
    metadata: Metadata
    is_active: boolean
    created_at: string
    updated_at: string
}
type ArrayValues<T extends readonly unknown[]> = T[number]
export type Address = Record<ArrayValues<typeof config['addressConfig']['fields']>, string>

export interface Metadata { }


export type DocumentTypePeople = { name: string, id: string, description: string };

export interface Customer {
    id: string;
    company_id: string;
    environment_id: string;
    person_id: string;
    customer_code: string | null;
    customer_type_id: string;
    credit_limit: string;
    payment_terms_days: number;
    metadata: Metadata;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CustomerType {
    id: string;
    name: string;
    description: string | null;
}

export type CustomerPerson = Pick<
    People,
    | "id"
    | "first_name"
    | "last_name"
    | "document_types_people_id"
    | "address_fields"
    | "address"
    | "metadata"
> & {
    company_id?: string;
    environment_id?: string;
    middle_name?: string | null;
    second_last_name?: string | null;
    document_number?: string | null;
    email: string | null;
    phone?: string | null;
    birth_date?: string | null;
    address_str?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
};

export interface CustomerSearchResult extends Customer {
    person: CustomerPerson;
    customer_type_name: string;
}