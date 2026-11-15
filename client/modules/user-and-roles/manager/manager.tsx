import {
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  UserRound,
  X,
} from 'lucide-react';

import { CreateUserForm } from '../components/form-create-user/form';
import { EditUserForm } from '../components/form-edit-user/form';
import { RoleForm } from '../components/form-role/form';
import { ToastProvider, } from '../../common/toast';
import { useManager } from './hook';
import { clsx } from 'clsx';
import { text } from '../../language';


const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-500'
const primaryColor20 = 'bg-linear-to-tr from-red-500/10 to-120% to-orange-600/10'
const textColor =
  "bg-linear-to-r from-red-500 to-orange-600 bg-clip-text text-transparent";

function ManagerContent() {

  const {
    users,
    roles,
    userRoles,
    loading,
    usersError,
    rolesError,
    assignmentsError,
    tab,
    selectedUserId,
    userSearch,
    filteredUsers,
    selectedUser,
    activeRoles,
    selectedRoles,
    roleGroups,
    assignRole,
    removeRole,
    onUserCreated,
    onUserSaved,
    loadRecords,
    setTab,
    setUserSearch,
    createUserOpen,
    setCreateUserOpen,
    editUserOpen,
    setEditUserOpen,
    roleModal,
    setRoleModal,
    assignmentRoleId,
    setAssignmentRoleId,
    onRoleSaved,
    setSelectedUserId
  } = useManager();


  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="flex bg-base-100 h-16 items-center gap-3 border-b border-base-300 px-6 py-4 lg:px-10">
        <UsersRound size={21} className="text-base-content/60" />

        <span className="text-sm font-medium text-base-content/70">
          {text('startModule.listAppliaction.userAndRoles')}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => void loadRecords()}
            disabled={loading}
            aria-label="Actualizar datos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>


      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <nav className="tabs tabs-boxed w-fit bg-base-100" aria-label="Administración">
          <button
            className={`tab gap-2 ${tab === 'users' ? 'tab-active' : ''}`}
            type="button"
            onClick={() => setTab('users')}
          >
            <UsersRound size={16} />
            Usuarios
          </button>
          <button
            className={`tab gap-2 ${tab === 'roles' ? 'tab-active' : ''}`}
            type="button"
            onClick={() => setTab('roles')}
          >
            <ShieldCheck size={16} />
            Roles y permisos
          </button>
        </nav>

        {loading && users.length === 0 && (
          <div className="flex min-h-48 items-center justify-center">
            <span className="loading loading-spinner loading-lg text-error" />
          </div>
        )}

        {tab === 'users' ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Usuarios</h2>
                <p className="text-sm text-base-content/60">
                  Crea cuentas y administra sus roles dentro del espacio actual.
                </p>
              </div>
              <button
                className={"btn btn-error btn-sm text-white " + primaryColor}
                type="button"
                onClick={() => setCreateUserOpen(true)}
              >
                <Plus size={16} />
                Crear usuario
              </button>
            </div>

            {usersError ? (
              <div className="alert alert-error" role="alert">
                <span>{usersError}</span>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
                <section className="card h-fit border border-base-300 bg-base-100 shadow-sm">
                  <div className="card-body gap-3 p-4">
                    <label className="input input-bordered flex items-center gap-2">
                      <UserRound size={16} className="text-base-content/40" />
                      <input
                        className="grow"
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Buscar usuario o correo..."
                      />
                    </label>

                    <div className="space-y-1">
                      {filteredUsers.map((user) => {
                        const assignedRoles = userRoles
                          .filter((assignment) => assignment.user_id === user.id)
                          .map((assignment) =>
                            roles.find((role) => role.id === assignment.role_id)?.name,
                          )
                          .filter((name): name is string => Boolean(name));
                        return (
                          <button
                            key={user.id}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedUserId === user.id
                              ? 'border-error/40 bg-error/5'
                              : 'border-transparent hover:bg-base-200'
                              }`}
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate font-semibold">
                                {user.username}
                              </span>
                              <span
                                className={`badge badge-sm ${user.is_active ? 'badge-error text-white' : 'badge-ghost'
                                  }`}
                              >
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </span>
                            <span className="block truncate text-xs text-base-content/60">
                              {user.email}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-1">
                              {assignedRoles.length > 0 ? (
                                assignedRoles.map((roleName) => (
                                  <span className="badge badge-ghost badge-xs" key={roleName}>
                                    {roleName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-warning">
                                  Sin roles asignados
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <p className="py-6 text-center text-sm text-base-content/60">
                          {users.length === 0
                            ? 'No hay usuarios registrados.'
                            : 'No se encontraron usuarios.'}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  {selectedUser ? (
                    <section className="card border border-base-300 bg-base-100 shadow-sm">
                      <div className="card-body gap-4 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-bold">{selectedUser.username}</h2>
                            <p className="text-sm text-base-content/60">
                              {selectedUser.email}
                            </p>
                          </div>
                          <button
                            className="btn btn-outline btn-sm"
                            type="button"
                            onClick={() => setEditUserOpen(true)}
                          >
                            <Pencil size={15} />
                            Editar usuario
                          </button>
                        </div>

                        <div className="divider my-0" />

                        <section className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold">Roles asignados</h3>
                            {assignmentsError && (
                              <span className="text-xs text-error" role="alert">
                                {assignmentsError}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {selectedRoles.map(({ assignment, role }) => (
                              <span
                                className="badge badge-sm gap-2 border-error/20 bg-error/5 text-error"
                                key={assignment.id}
                              >
                                {role.name}
                                <button
                                  type="button"
                                  className="btn btn-circle btn-ghost btn-xs"
                                  aria-label={`Retirar rol ${role.name}`}
                                  onClick={() => {
                                    const check = confirm('Estas seguro de retirar el rol? No podrás deshacer esta acción si eliminas un rol que te permita agregar permisos.');
                                    if (!check) {
                                      return;
                                    }
                                    void removeRole(assignment)
                                  }}
                                >
                                  <X size={7} />
                                </button>
                              </span>
                            ))}
                            {selectedRoles.length === 0 && (
                              <p className="text-sm text-base-content/60">
                                Este usuario todavía no tiene roles.
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <select
                              className="select select-bordered select-sm min-w-48"
                              value={assignmentRoleId}
                              onChange={(event) => setAssignmentRoleId(event.target.value)}
                              disabled={Boolean(rolesError)}
                              aria-label="Seleccionar rol para asignar"
                            >
                              <option value="">Selecciona un rol...</option>
                              {activeRoles
                                .filter(
                                  (role) =>
                                    !selectedRoles.some(
                                      (assigned) => assigned.role.id === role.id,
                                    ),
                                )
                                .map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() => void assignRole()}
                              disabled={
                                !assignmentRoleId ||
                                Boolean(assignmentsError) ||
                                Boolean(rolesError)
                              }
                            >
                              <Plus size={14} />
                              Asignar rol
                            </button>
                          </div>
                          {rolesError && (
                            <p className="text-xs text-error" role="alert">
                              {rolesError}
                            </p>
                          )}
                        </section>

                        <div className="divider my-0" />

                        <section className="space-y-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <ShieldCheck size={16} />
                            Permisos heredados
                          </div>
                          {selectedRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {Array.from(
                                new Set(
                                  selectedRoles.flatMap(({ role }) =>
                                    role.actions.filter(Boolean),
                                  ),
                                ),
                              ).map((action) => (
                                <span className="badge badge-ghost badge-sm" key={action}>
                                  {action}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-base-content/60">
                              No hay permisos efectivos porque no tiene roles asignados.
                            </p>
                          )}
                        </section>
                      </div>
                    </section>
                  ) : (
                    !loading && (
                      <div className="card border border-base-300 bg-base-100">
                        <div className="card-body text-center text-base-content/60">
                          Selecciona un usuario para administrar sus datos y roles.
                        </div>
                      </div>
                    )
                  )}

                  <section className="card border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body gap-3 p-4">
                      <div>
                        <h3 className="font-semibold">Equipos por rol</h3>
                        <p className="text-xs text-base-content/60">
                          Agrupación derivada: los usuarios con un mismo rol aparecen juntos.
                        </p>
                      </div>
                      {roleGroups.length === 0 ? (
                        <p className="text-sm text-base-content/60">
                          No hay roles activos para formar equipos.
                        </p>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {roleGroups.map(({ role, members }) => (
                            <div
                              className="rounded-lg border border-base-300 p-3"
                              key={role.id}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{role.name}</span>
                                <span className="badge badge-ghost badge-sm">
                                  {members.length}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-base-content/60">
                                {members.length > 0
                                  ? members.map((user) => user.username).join(', ')
                                  : 'Sin usuarios asignados'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Roles y permisos</h2>
                <p className="text-sm text-base-content/60">
                  Define acciones y administra los roles disponibles en este espacio.
                </p>
              </div>
              <button
                className={clsx(
                  "btn btn-sm text-white",
                  primaryColor
                )}
                type="button"
                onClick={() => setRoleModal({ role: null })}
              >
                <Plus size={16} />
                Crear rol
              </button>
            </div>

            {rolesError ? (
              <div className="alert alert-error" role="alert">
                <span>{rolesError}</span>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeRoles.map((role) => (
                  <article
                    className="card border border-base-300 bg-base-100 shadow-sm"
                    key={role.id}
                  >
                    <div className="card-body gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{role.name}</h3>
                          {role.description && (
                            <p className="text-sm text-base-content/60">
                              {role.description}
                            </p>
                          )}
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => setRoleModal({ role })}
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.actions.filter(Boolean).length > 0 ? (
                          role.actions.filter(Boolean).map((action) => (
                            <span className="badge badge-ghost badge-sm" key={action}>
                              {action}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-base-content/50">
                            Sin acciones asignadas
                          </span>
                        )}
                      </div>
                      {role.is_system && (
                        <span className="badge badge-outline badge-sm w-fit">
                          Rol del sistema
                        </span>
                      )}
                    </div>
                  </article>
                ))}
                {activeRoles.length === 0 && (
                  <div className="card border border-base-300 bg-base-100">
                    <div className="card-body text-base-content/60">
                      No hay roles activos.
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {createUserOpen && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Crear usuario</h2>
              <button
                className="btn btn-ghost btn-sm btn-square"
                type="button"
                aria-label="Cerrar"
                onClick={() => setCreateUserOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <CreateUserForm
              onCreated={onUserCreated}
              onCancel={() => setCreateUserOpen(false)}
            />
          </div>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="Cerrar diálogo"
            onClick={() => setCreateUserOpen(false)}
          />
        </div>
      )}

      {editUserOpen && selectedUser && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Editar usuario</h2>
              <button
                className="btn btn-ghost btn-sm btn-square"
                type="button"
                aria-label="Cerrar"
                onClick={() => setEditUserOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <EditUserForm
              key={selectedUser.id}
              user={selectedUser}
              onSaved={onUserSaved}
              onCancel={() => setEditUserOpen(false)}
            />
          </div>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="Cerrar diálogo"
            onClick={() => setEditUserOpen(false)}
          />
        </div>
      )}

      {roleModal && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box h-10/12 max-w-4xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {roleModal.role ? 'Editar rol' : 'Crear rol'}
              </h2>
              <button
                className="btn btn-ghost btn-sm btn-square"
                type="button"
                aria-label="Cerrar"
                onClick={() => setRoleModal(null)}
              >
                <X size={16} />
              </button>
            </div>
            <RoleForm
              key={roleModal.role?.id ?? 'new'}
              role={roleModal.role}
              onSaved={onRoleSaved}
              onCancel={() => setRoleModal(null)}
            />
          </div>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="Cerrar diálogo"
            onClick={() => setRoleModal(null)}
          />
        </div>
      )}
    </div>
  );
}

export default function Manager() {
  return (
    <ToastProvider>
      <ManagerContent />
    </ToastProvider>
  );
}
