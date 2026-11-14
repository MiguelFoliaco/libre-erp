import { companies, environments } from '../database/migrations/schema';

type Company = typeof companies.$inferInsert;
type Environment = Omit<typeof environments.$inferInsert, 'companyId'>;

export const companyInfo: Company = {
    address: {
        street: 'Carrera 10',
        number: '25-45',
        neighborhood: 'Getsemaní',
        city: 'Cartagena',
        state: 'Bolívar',
        postalCode: '130001',
        country: 'Colombia',
        countryCode: 'CO',
        latitude: 10.422,
        longitude: -75.547,
    },
    addressFields: [
        'street',
        'number',
        'neighborhood',
        'city',
        'state',
        'postalCode',
        'country',
    ],
    addressStr: 'Carrera 10 #25-45, Getsemaní, Cartagena, Bolívar, Colombia',
    legalName: 'Miguel Angel Foliaco',
    countryCode: 'CO',
    email: 'admin@foliacos.com',
    metadata: {},
    phone: '+57311111111',
    website: 'https://foliacos.com',
    tradeName: 'Foliacos',
    registrationNumber: '000000000',
    registrationType: 'NIT',
    isActive: true,
};

export const environmentInfo: Environment[] = [
    {
        name: 'Principal',
        slug: 'main',
        description: 'Entorno principal de desarrollo',
        type: 'development',
        metadata: {},
        isActive: true,
    },
];