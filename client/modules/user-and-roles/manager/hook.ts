import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../../lib/sdk';
import type {
    AssignRoleInput,
    RoleRecord,
    UserRecord,
    UserRoleRecord,
} from '../../../lib/user-and-roles';
import { describeUserAndRolesError } from '../../../lib/user-and-roles-errors';
import { useToast } from '../../common/toast';
import { text } from '../../language';

type ManagerTab = 'users' | 'roles';
type RoleModal = { role: RoleRecord | null } | null;



export const useManager = () => {
    const { notify } = useToast();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [userRoles, setUserRoles] = useState<UserRoleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [rolesError, setRolesError] = useState('');
    const [assignmentsError, setAssignmentsError] = useState('');
    const [tab, setTab] = useState<ManagerTab>('users');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [roleModal, setRoleModal] = useState<RoleModal>(null);
    const [assignmentRoleId, setAssignmentRoleId] = useState('');

    const loadRecords = useCallback(async () => {
        setLoading(true);
        setUsersError('');
        setRolesError('');
        setAssignmentsError('');

        const [usersResult, rolesResult, assignmentsResult] = await Promise.allSettled([
            apiClient.list<UserRecord>('users', { limit: 200 }),
            apiClient.list<RoleRecord>('roles', { limit: 200 }),
            apiClient.list<UserRoleRecord>('user-roles', { limit: 200 }),
        ]);

        if (usersResult.status === 'fulfilled') {
            const loadedUsers = usersResult.value.items;
            setUsers(loadedUsers);
            setSelectedUserId((current) =>
                loadedUsers.some((user) => user.id === current)
                    ? current
                    : loadedUsers[0]?.id ?? '',
            );
        } else {
            const error = describeUserAndRolesError(usersResult.reason);
            setUsersError(error.message);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
        }

        if (rolesResult.status === 'fulfilled') {
            setRoles(rolesResult.value.items);
        } else {
            const error = describeUserAndRolesError(rolesResult.reason);
            setRolesError(error.message);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
        }

        if (assignmentsResult.status === 'fulfilled') {
            setUserRoles(assignmentsResult.value.items);
        } else {
            const error = describeUserAndRolesError(assignmentsResult.reason);
            setAssignmentsError(error.message);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
        }

        setLoading(false);
    }, [notify]);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
    const activeRoles = roles.filter((role) => role.is_active);
    const selectedAssignments = userRoles.filter(
        (assignment) => assignment.user_id === selectedUser?.id,
    );
    const selectedRoles = selectedAssignments
        .map((assignment) => ({
            assignment,
            role: roles.find((role) => role.id === assignment.role_id),
        }))
        .filter(
            (item): item is { assignment: UserRoleRecord; role: RoleRecord } =>
                Boolean(item.role),
        );

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();
        if (!query) return users;
        return users.filter(
            (user) =>
                user.username.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query),
        );
    }, [userSearch, users]);

    const roleGroups = useMemo(
        () =>
            activeRoles.map((role) => ({
                role,
                members: userRoles
                    .filter((assignment) => assignment.role_id === role.id)
                    .map((assignment) =>
                        users.find((user) => user.id === assignment.user_id),
                    )
                    .filter((user): user is UserRecord => Boolean(user)),
            })),
        [activeRoles, userRoles, users],
    );

    async function assignRole() {
        if (!selectedUser || !assignmentRoleId) return;
        if (
            userRoles.some(
                (assignment) =>
                    assignment.user_id === selectedUser.id &&
                    assignment.role_id === assignmentRoleId,
            )
        ) {
            notify('info', text('startModule.userAndRoles.notifications.alreadyAssigned'));
            return;
        }

        try {
            const input: AssignRoleInput = {
                userId: selectedUser.id,
                roleId: assignmentRoleId,
            };
            await apiClient.create<UserRoleRecord>('user-roles', input);
            notify('success', text('startModule.userAndRoles.notifications.roleAssigned'));
            setAssignmentRoleId('');
            await loadRecords();
        } catch (cause: unknown) {
            const error = describeUserAndRolesError(cause);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
        }
    }

    async function removeRole(assignment: UserRoleRecord) {
        try {
            await apiClient.remove('user-roles', assignment.id);
            notify('success', text('startModule.userAndRoles.notifications.roleRemoved'));
            await loadRecords();
        } catch (cause: unknown) {
            const error = describeUserAndRolesError(cause);
            notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
        }
    }

    function onUserCreated(user: UserRecord) {
        setCreateUserOpen(false);
        setSelectedUserId(user.id);
        void loadRecords();
    }

    function onUserSaved(updatedUser: UserRecord) {
        setUsers((current) =>
            current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
        );
        setEditUserOpen(false);
        void loadRecords();
    }

    function onRoleSaved(savedRole: RoleRecord) {
        setRoles((current) => {
            const exists = current.some((role) => role.id === savedRole.id);
            return exists
                ? current.map((role) => (role.id === savedRole.id ? savedRole : role))
                : [savedRole, ...current];
        });
        setRoleModal(null);
        void loadRecords();
    }

    return {
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
        selectedAssignments,
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
    }
}