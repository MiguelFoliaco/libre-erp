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