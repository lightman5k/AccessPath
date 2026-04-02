import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authService } from "@/lib/auth/service";
import { getUserRepository } from "@/lib/auth/default-repositories";

export default async function AdminUsersPage() {
  const users = await getUserRepository().findAll();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin: User Accounts</h1>
      <p className="text-sm text-slate-600">Displaying all users from the auth database.</p>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{user.id}</td>
                <td className="px-3 py-2 text-slate-700">{user.email}</td>
                <td className="px-3 py-2 text-slate-700">{user.fullName}</td>
                <td className="px-3 py-2 text-slate-700">{user.companyName}</td>
                <td className="px-3 py-2 text-slate-700">{user.role}</td>
                <td className="px-3 py-2 text-slate-700">{user.plan}</td>
                <td className="px-3 py-2 text-slate-700">{user.status}</td>
                <td className="px-3 py-2 text-slate-700">{user.trialEndsAt ?? "n/a"}</td>
                <td className="px-3 py-2 text-slate-700">{user.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

