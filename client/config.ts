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
    streetNumber: "startModule.settings.addressFields.streetNumber",
    route: "startModule.settings.addressFields.street",
    subpremise: "startModule.settings.addressFields.subpremise",
    neighborhood: "startModule.settings.addressFields.neighborhood",
    locality: "startModule.settings.addressFields.city",
    administrativeAreaLevel2: "startModule.settings.addressFields.county",
    administrativeAreaLevel1: "startModule.settings.addressFields.state",
    postalCode: "startModule.settings.addressFields.postalCode",
    country: "startModule.settings.addressFields.country",
};