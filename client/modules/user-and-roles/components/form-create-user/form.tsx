import { clsx } from 'clsx';
import type { UserRecord } from '../../../../lib/user-and-roles';
import { useCreateUserForm } from './hook';

interface CreateUserFormProps {
  onCreated: (user: UserRecord) => void;
  onCancel: () => void;
}

const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-500'


export function CreateUserForm({ onCreated, onCancel }: CreateUserFormProps) {
  const form = useCreateUserForm(onCreated);

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit}>
      <div className="form-control w-full">
        <span className="label-text text-sm mb-1">Persona</span>
        <span className="mb-1 ml-2 text-xs text-base-content/60">
          Escribe al menos dos caracteres y selecciona una persona existente.
        </span>
        <input
          className="input input-sm outline-none w-full"
          value={form.personQuery}
          onChange={(event) => form.clearPersonSearch(event.target.value)}
          placeholder="Buscar por nombre o documento..."
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={form.people.length > 0}
          required
        />
        {form.peopleLoading && (
          <span className="mt-1 text-xs text-base-content/60">Buscando personas...</span>
        )}
        {form.people.length > 0 && (
          <ul className="menu mt-1 max-h-48 w-full flex-nowrap overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow">
            {form.people.map((person) => {
              const label = [
                person.first_name,
                person.middle_name,
                person.last_name,
                person.second_last_name,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => form.choosePerson(person)}
                  >
                    <span>{label}</span>
                    {person.document_number && (
                      <span className="text-xs text-base-content/50">
                        {person.document_number}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!form.peopleLoading &&
          form.personQuery.trim().length >= 2 &&
          form.people.length === 0 &&
          !form.peopleError && (
            <span className="mt-1 text-xs text-base-content/60">
              No se encontraron personas.
            </span>
          )}
        {form.peopleError && (
          <span className="mt-1 text-xs text-error" role="alert">
            {form.peopleError}
          </span>
        )}
      </div>

      <div className="form-control w-full">
        <span className="label-text text-sm mb-1">Nombre de usuario</span>
        <input
          className="input outline-none input-sm w-full"
          value={form.username}
          onChange={(event) => form.setUsername(event.target.value)}
          maxLength={100}
          autoComplete="username"
          required
        />
      </div>

      <div className="form-control w-full">
        <span className="label-text text-sm mb-1">Correo electrónico</span>
        <input
          className="input outline-none input-sm w-full"
          type="email"
          value={form.email}
          onChange={(event) => form.setEmail(event.target.value)}
          maxLength={255}
          autoComplete="email"
          required
        />
      </div>

      <p className="text-xs text-base-content/60">
        Se generará una contraseña segura al crear la cuenta. La entrega de los accesos se añadirá después.
      </p>

      <div className="flex justify-end gap-2">
        <button className="btn btn-sm btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={clsx("btn btn-sm btn-error text-white ", primaryColor)}
          type="submit"
          disabled={form.submitting || !form.selectedPerson}
        >
          {form.submitting && <span className="loading loading-spinner loading-xs" />}
          Crear usuario
        </button>
      </div>
    </form>
  );
}
