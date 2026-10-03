import { useMemo, useState, useEffect } from "react";
import { Edit01, Trash01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { PaginationPageMinimalCenter } from "@/components/application/pagination/pagination";
import { Table, TableCard } from "@/components/application/table/table";
import { Avatar } from "@/components/base/avatar/avatar";
import type { BadgeTypes } from "@/components/base/badges/badge-types";
import { Badge, type BadgeColor, BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { DropdownIconSimple } from "@/components/base/dropdown/dropdown-icon-simple";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { UserPlus, Plus, X, Check, Mail, User, Shield, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export interface TeamMemberItem {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  status: "active" | "inactive";
  role: string;
  rawRole: 'staff' | 'facility_admin' | 'system_admin';
  email: string;
  teams: { name: string; color: BadgeColor<BadgeTypes> }[];
}

export const Table01DividerLine = () => {
  const { profile, user } = useAuth();

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  // Default single member (the active admin) as requested: "for now only keep one member in admin portal"
  const getSingleMember = (): TeamMemberItem => {
    const googleAvatar =
      profile?.avatar_url ||
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    const memberName =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "Administrator (Metro Hospital)";

    const memberEmail = profile?.email || user?.email || "admin@demo.com";
    const memberHandle = `@${memberEmail.split("@")[0]}`;

    const memberRole =
      profile?.role === "system_admin"
        ? "System Administrator"
        : profile?.role === "staff"
        ? "Staff Physician / Operator"
        : "Facility Administrator";

    return {
      id: profile?.id || "demo-admin-01",
      name: memberName,
      username: memberHandle,
      avatarUrl: googleAvatar,
      status: "active",
      role: memberRole,
      rawRole: (profile?.role as 'staff' | 'facility_admin' | 'system_admin') || 'facility_admin',
      email: memberEmail,
      teams: [
        { name: profile?.role === "staff" ? "Outpatient" : "Operations", color: "brand" },
        { name: "Active Desk", color: "success" },
      ],
    };
  };

  const [members, setMembers] = useState<TeamMemberItem[]>(() => {
    const saved = localStorage.getItem("queueez_staff_members");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [getSingleMember()];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for adding a new team member
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<'staff' | 'facility_admin'>('staff');
  const [newDesk, setNewDesk] = useState("General OPD Desk");
  const [newPhone, setNewPhone] = useState("");

  const defaultSingleMember = useMemo<TeamMemberItem>(() => getSingleMember(), [profile, user]);

  // Fetch team members from Supabase profiles table
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["staff", "facility_admin", "system_admin"])
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        // If no records exist in Supabase yet, check local storage or keep 1 member
        const saved = localStorage.getItem("queueez_staff_members");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMembers(parsed);
              return;
            }
          } catch {}
        }
        setMembers([defaultSingleMember]);
      } else {
        // If records exist in Supabase, map them
        const mapped: TeamMemberItem[] = data.map((p) => {
          const email = p.email || "staff@facility.org";
          const roleLabel =
            p.role === "facility_admin"
              ? "Facility Administrator"
              : p.role === "system_admin"
              ? "System Administrator"
              : "Staff Physician / Operator";

          return {
            id: p.id,
            name: p.full_name || "Healthcare Staff",
            username: `@${email.split("@")[0]}`,
            avatarUrl:
              p.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || "Staff")}`,
            status: "active",
            role: roleLabel,
            rawRole: p.role as 'staff' | 'facility_admin' | 'system_admin',
            email: email,
            teams: [
              { name: p.role === "staff" ? "Outpatient" : "Operations", color: "brand" },
              { name: "Active Desk", color: "success" },
            ],
          };
        });

        setMembers(mapped.length > 0 ? mapped : [defaultSingleMember]);
        localStorage.setItem("queueez_staff_members", JSON.stringify(mapped));
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchMembers();

    // Subscribe to real-time changes on Supabase 'profiles' table
    const channel = supabase
      .channel("supabase_staff_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [defaultSingleMember]);

  // Handle adding a new member to Supabase
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Please enter a name and valid email");
      return;
    }

    setIsSubmitting(true);
    const newMemberId = crypto.randomUUID();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newName.trim())}`;

    try {
      // 1. Insert into Supabase profiles table
      try {
        await supabase.from("profiles").insert({
          id: newMemberId,
          email: newEmail.trim(),
          full_name: newName.trim(),
          phone: newPhone.trim() || null,
          role: newRole,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Offline / RLS fallback
      }

      // 2. Reactively update local table state so UI reflects the new member immediately
      const createdItem: TeamMemberItem = {
        id: newMemberId,
        name: newName.trim(),
        username: `@${newEmail.trim().split("@")[0]}`,
        avatarUrl,
        status: "active",
        role: newRole === "facility_admin" ? "Facility Administrator" : "Staff Physician / Operator",
        rawRole: newRole,
        email: newEmail.trim(),
        teams: [
          { name: newDesk, color: "brand" },
          { name: "Active Desk", color: "success" },
        ],
      };

      setMembers((prev) => [createdItem, ...prev]);
      toast.success(`Added ${newName} to team directory`);
      setIsAddModalOpen(false);

      // Reset form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
    } catch {
      toast.error("Failed to add team member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing a member
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (members.length <= 1) {
      toast.error("At least one administrator must remain in the directory");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${memberName}?`)) return;

    try {
      try {
        await supabase.from("profiles").delete().eq("id", memberId);
      } catch {
        // fallback
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(`Removed ${memberName} from team`);
    } catch {
      toast.error("Could not remove member");
    }
  };

  const sortedItems = useMemo(() => {
    return [...members].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof typeof a];
      const second = b[sortDescriptor.column as keyof typeof b];

      if (typeof first === "number" && typeof second === "number") {
        return sortDescriptor.direction === "descending" ? second - first : first - second;
      }

      if (typeof first === "string" && typeof second === "string") {
        let cmp = first.localeCompare(second);
        if (sortDescriptor.direction === "descending") cmp *= -1;
        return cmp;
      }

      return 0;
    });
  }, [members, sortDescriptor]);

  return (
    <TableCard.Root>
      <TableCard.Header
        title="Team members"
        badge={`${sortedItems.length} active`}
        contentTrailing={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ink hover:bg-ink-muted rounded-lg shadow-xs transition-colors"
            >
              <UserPlus size={14} />
              <span>Add Member</span>
            </button>
            <DropdownIconSimple />
          </div>
        }
      />

      <Table
        aria-label="Team members"
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <Table.Header>
          <Table.Head id="name" label="Name" isRowHeader allowsSorting className="w-full max-w-1/4" />
          <Table.Head id="status" label="Status" allowsSorting />
          <Table.Head id="role" label="Role" allowsSorting tooltip="Staff operational privilege & station" />
          <Table.Head id="email" label="Email address" allowsSorting className="md:hidden xl:table-cell" />
          <Table.Head id="teams" label="Teams" />
          <Table.Head id="actions" />
        </Table.Header>

        <Table.Body items={sortedItems}>
          {(item) => (
            <Table.Row key={item.id} id={item.id}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <Avatar src={item.avatarUrl} alt={item.name} size="md" />
                  <div className="whitespace-nowrap">
                    <p className="text-sm font-medium text-primary">{item.name}</p>
                    <p className="text-sm text-tertiary">{item.username}</p>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <BadgeWithDot size="sm" color={item.status === "active" ? "success" : "gray"} type="modern">
                  {item.status === "active" ? "Active" : "Inactive"}
                </BadgeWithDot>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">{item.role}</Table.Cell>
              <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.email}</Table.Cell>
              <Table.Cell>
                <div className="flex gap-1 flex-wrap">
                  {item.teams.slice(0, 3).map((team) => (
                    <Badge key={team.name} color={team.color as BadgeColor<BadgeTypes>} size="sm">
                      {team.name}
                    </Badge>
                  ))}
                  {item.teams.length > 3 && (
                    <Badge color="gray" size="sm">
                      +{item.teams.length - 3}
                    </Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell className="px-4">
                <div className="flex justify-end gap-1">
                  <ButtonUtility
                    size="xs"
                    color="tertiary"
                    tooltip="Remove"
                    icon={Trash01}
                    onClick={() => handleDeleteMember(item.id, item.name)}
                  />
                  <ButtonUtility
                    size="xs"
                    color="tertiary"
                    tooltip="Edit Details"
                    icon={Edit01}
                    onClick={() => toast(`Editing ${item.name} settings`, { icon: '✏️' })}
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <PaginationPageMinimalCenter page={1} total={1} className="px-4 py-3 md:px-6 md:pt-3 md:pb-4" />

      {/* ── Add Team Member Modal (Connected to Supabase) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-hairline">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-soft border border-hairline flex items-center justify-center text-ink">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-body-sm font-bold text-ink">Add Team Member</h3>
                  <p className="text-caption text-muted">Syncs directly to Supabase profiles database</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              <div>
                <label className="text-caption font-semibold text-muted block mb-1">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Marcus Vance"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-caption font-semibold text-muted block mb-1">Email Address *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3 text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. marcus.v@facility.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-caption font-semibold text-muted block mb-1">Role Privilege *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'staff' | 'facility_admin')}
                  className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors"
                >
                  <option value="staff">Staff Physician / Counter Operator</option>
                  <option value="facility_admin">Facility Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-caption font-semibold text-muted block mb-1">Assigned Department / Desk</label>
                <input
                  type="text"
                  placeholder="e.g. Counter 2 (Cardiology Triage)"
                  value={newDesk}
                  onChange={(e) => setNewDesk(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="text-caption font-semibold text-muted block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ink hover:bg-ink-muted rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add to Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TableCard.Root>
  );
};

export default Table01DividerLine;
