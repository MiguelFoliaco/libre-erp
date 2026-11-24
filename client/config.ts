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
    },
    currency: {
        symbol: '$',
        code: 'COP', //  ISO 4217
        lang: 'es-CO',
        maximumFractionDigits: 2,
        style: 'currency' as 'currency' | 'percent' | 'unit'
    },
    documentVars: {
        fields: {
            // PARA CLIENTES
            client: {
                var_client_name: {
                    type: 'text',
                    description: 'Nombre o razon social del cliente',
                    value: 'client.person.name'
                },
                var_client_email: {
                    type: 'text',
                    description: 'Correo electrónico del cliente',
                    value: 'client.person.email'
                },
                var_client_phone: {
                    type: 'text',
                    description: 'Teléfono del cliente',
                    value: 'client.person.phone'
                },
                var_client_address: {
                    type: 'text',
                    description: 'Dirección del cliente',
                    value: 'client.person.address_str'
                },
                var_client_document: {
                    type: 'text',
                    description: 'Documento del cliente',
                    value: 'client.person.document_number'
                },
                var_client_document_type: {
                    type: 'text',
                    description: 'Tipo de documento del cliente',
                    value: 'client.person.document_types_people.name'
                },
                var_client_city: {
                    type: 'text',
                    description: 'Ciudad del cliente',
                    value: 'client.person.address.locality'
                },
                var_client_country: {
                    type: 'text',
                    description: 'País del cliente',
                    value: 'client.person.address.country'
                },
                var_client_postal_code: {
                    type: 'text',
                    description: 'Código postal del cliente',
                    value: 'client.person.address.postalCode'
                },
                var_document_number: {
                    type: 'text',
                    description: 'Número del documento',
                    value: 'document_number' // Esto ya incluye el prefijo del tipo de documento, por ejemplo: "INV-0001"
                },
            },


            // PARA PROVEEDORES
            supplier: {
                var_supplier_name: {
                    type: 'text',
                    description: 'Nombre o razon social del Proveedor',
                    value: 'supplier.person.name'
                },
                var_supplier_email: {
                    type: 'text',
                    description: 'Correo electrónico del Proveedor',
                    value: 'supplier.person.email'
                },
                var_supplier_phone: {
                    type: 'text',
                    description: 'Teléfono del Proveedor',
                    value: 'supplier.person.phone'
                },
                var_supplier_address: {
                    type: 'text',
                    description: 'Dirección del Proveedor',
                    value: 'supplier.person.address_str'
                },
                var_supplier_document: {
                    type: 'text',
                    description: 'Documento del Proveedor',
                    value: 'supplier.person.document_number'
                },
                var_supplier_document_type: {
                    type: 'text',
                    description: 'Tipo de documento del Proveedor',
                    value: 'supplier.person.document_types_people.name'
                },
                var_supplier_city: {
                    type: 'text',
                    description: 'Ciudad del Proveedor',
                    value: 'supplier.person.address.locality'
                },
                var_supplier_country: {
                    type: 'text',
                    description: 'País del Proveedor',
                    value: 'supplier.person.address.country'
                },
                var_supplier_postal_code: {
                    type: 'text',
                    description: 'Código postal del Proveedor',
                    value: 'supplier.person.address.postalCode'
                },
            },

            // Para productos
            product: {
                var_product_sku: {
                    type: 'text',
                    description: 'SKU del producto',
                    value: 'products.sku' // El nombre en plural es porque viene de un array de productos, se debe usar el primer producto del array
                },
                var_product_name: {
                    type: 'text',
                    description: 'Nombre del producto',
                    value: 'products.name' // El nombre en plural es porque viene de un array de productos, se debe usar el primer producto del array
                },
                var_product_description: {
                    type: 'text',
                    description: 'Descripción del producto',
                    value: 'products.description'
                },
                var_product_price: {
                    type: 'number',
                    description: 'Precio del producto',
                    value: 'products.price'
                },
                var_product_quantity: {
                    type: 'number',
                    description: 'Cantidad del producto',
                    value: 'products.quantity'
                },
                var_product_unit: {
                    type: 'text',
                    description: 'Unidad del producto',
                    value: 'products.unit'
                },
                var_product_total: {
                    type: 'number',
                    description: 'Total del producto',
                    value: 'products.total'
                }

            },

            employer: {
                var_employer_name: {
                    type: 'text',
                    description: 'Nombre o razon social del Empleador',
                    value: 'user.person.name'
                },
                var_employer_email: {
                    type: 'text',
                    description: 'Correo electrónico del Empleador',
                    value: 'user.person.email'
                },
                var_employer_phone: {
                    type: 'text',
                    description: 'Número de teléfono del Empleador',
                    value: 'user.person.phone'
                },
            },

            // TODOS LOS DOCUMENTOS
            global: {
                var_current_date: {
                    type: 'date',
                    description: 'Hora actual, usalo para fechas en que se deba generar un documento, otra fechas como la de vencimiento se deben calcular a partir de esta',
                    value: 'date'
                },
                var_document_type: {
                    type: 'text',
                    description: 'Tipo de documento',
                    value: 'document_type.name'
                },
                var_document_due_date: {
                    type: 'date',
                    description: 'Fecha de vencimiento del documento',
                    value: 'document_due_date'
                },
            }
            // Si se necesitan mas variables asignarlas aquí, el valor de la variable debe ser el path al valor en el objeto del documento, por ejemplo: "client.person.name" para obtener el nombre del cliente, 
            // el objeto documento lo puede ver aqui: https://libre-erp.foliacos.com/documentation/es/api/documentos
        }

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