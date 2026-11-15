import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../../../lib/sdk';
import type {
  CreateUserInput,
  PersonSearchResult,
  UserRecord,
} from '../../../../lib/user-and-roles';
import { describeUserAndRolesError } from '../../../../lib/user-and-roles-errors';
import { useToast } from '../../../common/toast';

function personLabel(person: PersonSearchResult): string {
  const name = [
    person.first_name,
    person.middle_name,
    person.last_name,
    person.second_last_name,
  ]
    .filter(Boolean)
    .join(' ');
  return person.document_number ? `${name} · ${person.document_number}` : name;
}

function generatePassword(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function useCreateUserForm(onCreated: (user: UserRecord) => void) {
  const { notify } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchResult | null>(null);
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const query = personQuery.trim();
    if (!selectedPerson && query.length >= 2) {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        setPeopleLoading(true);
        setPeopleError('');
        apiClient
          .searchPeople(query, controller.signal)
          .then(setPeople)
          .catch((cause: unknown) => {
            if (controller.signal.aborted) return;
            const error = describeUserAndRolesError(cause);
            setPeopleError(error.message);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
          })
          .finally(() => {
            if (!controller.signal.aborted) setPeopleLoading(false);
          });
      }, 250);

      return () => {
        clearTimeout(timeout);
        controller.abort();
      };
    }

    setPeople([]);
    setPeopleLoading(false);
    setPeopleError('');
  }, [notify, personQuery, selectedPerson]);

  function choosePerson(person: PersonSearchResult) {
    setSelectedPerson(person);
    setPersonQuery(personLabel(person));
    setEmail(person?.email ?? '');
    setPeople([]);
  }

  function clearPersonSearch(value: string) {
    setSelectedPerson(null);
    setPersonQuery(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPerson) {
      setPeopleError('Selecciona una persona existente para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      const input: CreateUserInput = {
        personId: selectedPerson.id,
        username: username.trim(),
        email: email.trim(),
        password: generatePassword(),
      };
      const user = await apiClient.create<UserRecord>('users', input);
      notify('success', 'Usuario creado. La contraseña se generó y guardó de forma segura.');
      onCreated(user);
    } catch (cause: unknown) {
      const error = describeUserAndRolesError(cause);
      notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    username,
    setUsername,
    email,
    setEmail,
    personQuery,
    clearPersonSearch,
    selectedPerson,
    people,
    peopleLoading,
    peopleError,
    submitting,
    choosePerson,
    handleSubmit,
  };
}
