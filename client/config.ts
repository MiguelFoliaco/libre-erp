import type { PathText } from "./modules/language";

export const config = {
    addressConfig: {
        fields: [
            'streetNumber',
            'route',
            'subpremise',
            'neighborhood',
            'locality',
            'administrativeAreaLevel2',
            'administrativeAreaLevel1',
            'postalCode',
            'country'
        ] as const,

        requiredFields: [
            'route',
            'locality',
            'administrativeAreaLevel1',
            'country'
        ] as const,

        order: [
            'streetNumber',
            'route',
            'subpremise',
            'neighborhood',
            'locality',
            'administrativeAreaLevel2',
            'administrativeAreaLevel1',
            'postalCode',
            'country'
        ] as const
    }
};


export type AddressField = (typeof config.addressConfig.fields)[number];
export type AddressValues = Record<AddressField, string>;

export const addressFieldLabels: Record<AddressField, PathText> = {
    streetNumber: "modules.settings.addressFields.streetNumber",
    route: "modules.settings.addressFields.street",
    subpremise: "modules.settings.addressFields.subpremise",
    neighborhood: "modules.settings.addressFields.neighborhood",
    locality: "modules.settings.addressFields.city",
    administrativeAreaLevel2: "modules.settings.addressFields.county",
    administrativeAreaLevel1: "modules.settings.addressFields.state",
    postalCode: "modules.settings.addressFields.postalCode",
    country: "modules.settings.addressFields.country",
};