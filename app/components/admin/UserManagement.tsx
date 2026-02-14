'use client'

import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { formatTimestampForDisplay, handleApiError } from '../../lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  last_login: string
  created_at: string
  permissions: string[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadUsers()
    // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await fetchWithAuth('/api/admin/users') as { users?: User[] } | null
      setUsers(data?.users || [])
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load users')
      logger.error('Failed to load users:', error)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetchWithAuth('/api/admin/users/role', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role: newRole })
      })
      success('User role updated successfully')
      loadUsers()
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update user role')
      logger.error('Failed to update role:', error)
      showError(errorMessage)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await fetchWithAuth('/api/admin/users/status', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, status: newStatus })
      })
      success('User status updated successfully')
      loadUsers()
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update user status')
      logger.error('Failed to update status:', error)
      showError(errorMessage)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingUserId(userId)
      await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      success('User deleted successfully')
      setShowDeleteConfirm(null)
      loadUsers()
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete user')
      logger.error('Failed to delete user:', error)
      showError(errorMessage)
    } finally {
      setDeletingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-slate-400">Manage users, roles, and permissions</p>
        </div>
        <button className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-slate-800 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`bg-slate-800 border border-white/10 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 ${
                        user.status === 'active' ? 'text-emerald-400' : 
                        user.status === 'suspended' ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatTimestampForDisplay(user.last_login)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowModal(true)
                      }}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(user.id)}
                      disabled={deletingUserId === user.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="card-glass p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <div className="text-white font-semibold">{selectedUser.name}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Email</label>
                <div className="text-white font-semibold">{selectedUser.email}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Role</label>
                <div className="text-white font-semibold capitalize">{selectedUser.role}</div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Permissions</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUser.permissions.map((perm) => (
                    <span key={perm} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="card-glass p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={deletingUserId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingUserId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

