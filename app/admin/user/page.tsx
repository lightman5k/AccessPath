"use client";

import { useEffect, useState } from "react";
import type { MockPlan, MockRole, StoredUserStatus } from "@/types";

const planOptions: MockPlan[] = ["free", "pro", "premium"];
const roleOptions: MockRole[] = ["agent", "admin"];


type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: MockRole;
  plan: MockPlan;
  status: StoredUserStatus;
  trialEndsAt: string | null;
  createdAt: string;
};

export default function AdminUserPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [planDrafts, setPlanDrafts] = useState<Record<string, MockPlan>>({});
  const [roleDrafts, setRoleDrafts] = useState<Record<string, MockRole>>({});

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/user", { cache: "no-store" });
        if (!response.ok) throw new Error(`Unable to load users (status ${response.status})`);

        const payload = (await response.json()) as { success: boolean; users: AdminUser[] };
        if (!payload.success) throw new Error("Invalid api response");

        if (!cancelled) {
          setUsers(payload.users);
          setPlanDrafts(
            payload.users.reduce((acc, user) => {
              acc[user.id] = user.plan;
              return acc;
            }, {} as Record<string, MockPlan>),
          );
          setRoleDrafts(
            payload.users.reduce((acc, user) => {
              acc[user.id] = user.role;
              return acc;
            }, {} as Record<string, MockRole>),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    setSubmitting((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/admin/user?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || `Failed to delete user ${id}`);
      }

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown delete error");
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePlanChange = (id: string, plan: MockPlan) => {
    setPlanDrafts((prev) => ({ ...prev, [id]: plan }));
  };

  const handleRoleChange = (id: string, role: MockRole) => {
    setRoleDrafts((prev) => ({ ...prev, [id]: role }));
  };

  const handleUpdatePlan = async (id: string) => {
    const newPlan = planDrafts[id];
    if (!newPlan) return;

    setSubmitting((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/admin/user?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || `Failed to update plan for user ${id}`);
      }

      const payload = await response.json();
      if (!payload?.success || !payload?.user) {
        throw new Error(payload?.error || "Invalid API response");
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, plan: payload.user.plan } : user)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown plan update error");
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleUpdateRole = async (id: string) => {
    const newRole = roleDrafts[id];
    if (!newRole) return;

    setSubmitting((prev) => ({ ...prev, [id]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/admin/user?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || `Failed to update role for user ${id}`);
      }

      const payload = await response.json();
      if (!payload?.success || !payload?.user) {
        throw new Error(payload?.error || "Invalid API response");
      }

      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: payload.user.role } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown role update error");
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin: User Accounts</h1>
        <p className="text-sm text-slate-600">Manage user plans, roles, and account access.</p>
      </div>


      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-600">ID</th>
                <th className="px-3 py-2 font-medium text-slate-600">Email</th>
                <th className="px-3 py-2 font-medium text-slate-600">Name</th>
                <th className="px-3 py-2 font-medium text-slate-600">Company</th>
                <th className="px-3 py-2 font-medium text-slate-600">Role</th>
                <th className="px-3 py-2 font-medium text-slate-600">Plan</th>
                <th className="px-3 py-2 font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 font-medium text-slate-600">Trial ends</th>
                <th className="px-3 py-2 font-medium text-slate-600">Created</th>
                <th className="px-3 py-2 font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{user.id}</td>
                  <td className="px-3 py-2 text-slate-700">{user.email}</td>
                  <td className="px-3 py-2 text-slate-700">{user.fullName}</td>
                  <td className="px-3 py-2 text-slate-700">{user.companyName}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <select
                      className="rounded-md border border-slate-100 bg-white px-2 py-1 text-xs"
                      value={roleDrafts[user.id] ?? user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value as MockRole)}
                    >
                      {roleOptions.map((roleOption) => (
                        <option key={roleOption} value={roleOption}>
                          {roleOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <select
                      className="rounded-md border border-slate-100 bg-white px-2 py-1 text-xs"
                      value={planDrafts[user.id] ?? user.plan}
                      onChange={(event) => handlePlanChange(user.id, event.target.value as MockPlan)}
                    >
                      {planOptions.map((planOption) => (
                        <option key={planOption} value={planOption}>
                          {planOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{user.status}</td>
                  <td className="px-3 py-2 text-slate-700">{user.trialEndsAt ?? "n/a"}</td>
                  <td className="px-3 py-2 text-slate-700">{user.createdAt}</td>
                  <td className="px-3 py-2 flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                      type="button"
                      disabled={submitting[user.id] || planDrafts[user.id] === user.plan}
                      onClick={() => handleUpdatePlan(user.id)}
                    >
                      {submitting[user.id] ? "Updating..." : "Update plan"}
                    </button>
                    <button
                      className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                      type="button"
                      disabled={submitting[user.id] || roleDrafts[user.id] === user.role}
                      onClick={() => handleUpdateRole(user.id)}
                    >
                      {submitting[user.id] ? "Updating..." : "Set role"}
                    </button>
                    <button
                      className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
                      type="button"
                      disabled={submitting[user.id]}
                      onClick={() => handleDelete(user.id)}
                    >
                      {submitting[user.id] ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
