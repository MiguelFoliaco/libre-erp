import { hashPassword } from '../../auth/password';
import { companyInfo, environmentInfo } from '../../configuration/company.info';
import { Schema, type DB } from './type';

const ADMIN_USERNAME = 'superadmin';
const ADMIN_EMAIL = 'superadmin@superadmin.com';

export async function createSeed(db: DB) {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be configured and contain at least 12 characters',
    );
  }

  return db.transaction(async (tx) => {
    const [company] = await tx
      .insert(Schema.companies)
      .values(companyInfo)
      .returning({ id: Schema.companies.id });
    if (!company) {
      throw new Error('Failed to create the initial company');
    }

    const environments = await tx
      .insert(Schema.environments)
      .values(environmentInfo.map((environment) => ({
        ...environment,
        companyId: company.id,
      })))
      .returning({
        id: Schema.environments.id,
        slug: Schema.environments.slug,
      });
    const environment = environments.find(({ slug }) => slug === 'main');
    if (!environment) {
      throw new Error('The seed must create an environment with slug "main"');
    }

    const [documentType] = await tx
      .insert(Schema.documentTypesPeople)
      .values({
        name: 'Sin documento',
        description: 'Tipo de documento inicial para el administrador',
      })
      .returning({ id: Schema.documentTypesPeople.id });
    if (!documentType) {
      throw new Error('Failed to create the administrator document type');
    }

    const [person] = await tx
      .insert(Schema.people)
      .values({
        companyId: company.id,
        environmentId: environment.id,
        firstName: 'Super',
        lastName: 'Admin',
        documentTypesPeopleId: documentType.id,
        email: ADMIN_EMAIL,
        isActive: true,
      })
      .returning({ id: Schema.people.id });
    if (!person) {
      throw new Error('Failed to create the administrator person');
    }

    const passwordHash = await hashPassword(adminPassword);
    const [user] = await tx
      .insert(Schema.users)
      .values({
        companyId: company.id,
        environmentId: environment.id,
        personId: person.id,
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        passwordHash,
        authProvider: 'local',
        isActive: true,
      })
      .returning({ id: Schema.users.id });
    if (!user) {
      throw new Error('Failed to create the administrator user');
    }

    const [role] = await tx
      .insert(Schema.roles)
      .values({
        companyId: company.id,
        environmentId: environment.id,
        name: 'Super Admin',
        description: 'Administrador inicial del sistema',
        actions: ['*'],
        isSystem: true,
        isActive: true,
      })
      .returning({ id: Schema.roles.id });
    if (!role) {
      throw new Error('Failed to create the administrator role');
    }

    await tx.insert(Schema.userRoles).values({
      companyId: company.id,
      environmentId: environment.id,
      userId: user.id,
      roleId: role.id,
    });

    return {
      companyId: company.id,
      environmentId: environment.id,
      userId: user.id,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
    };
  });
}
