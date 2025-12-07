"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  userRole: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
  joinedAt: string;
  lastActiveAt: string | null;
}

interface MemberActivity {
  activeStreams: Array<{
    id: string;
    name: string;
    divedAt: string;
  }>;
  activeWorkItems: Array<{
    id: string;
    title: string;
    streamName: string;
    energyState: string;
    energyContributed: number;
    isPrimary: boolean;
  }>;
  crystalsCompleted: number;
  totalEnergyContributed: number;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: string;
    name: string;
  };
}

interface IncomingInvite {
  id: string;
  token: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  teamId: string;
  teamName: string;
  invitedByName: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  currentUserRole: string;
  members: TeamMember[];
}

const roleColors: Record<string, { bg: string; text: string }> = {
  owner: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  admin: { bg: "bg-purple-500/20", text: "text-purple-400" },
  member: { bg: "bg-blue-500/20", text: "text-blue-400" },
};

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState<string | null>(null);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberActivity, setMemberActivity] = useState<MemberActivity | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        if (res.status === 404) {
          setError("No team found. Create one in settings.");
        } else {
          setError("Failed to load team");
        }
        return;
      }
      const data = await res.json();
      setTeam(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
    } catch {
      setError("Failed to load team");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/team/invites");
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch {
      // Ignore invite fetch errors
    }
  }, []);

  const fetchIncomingInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/me/invites");
      if (res.ok) {
        const data = await res.json();
        setIncomingInvites(data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const handleAcceptInvite = async (token: string) => {
    setIsAcceptingInvite(token);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to accept invite");
        return;
      }

      // Refresh the page to show new team
      window.location.reload();
    } catch {
      alert("Failed to accept invite");
    } finally {
      setIsAcceptingInvite(null);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchInvites();
    fetchIncomingInvites();
  }, [fetchTeam, fetchInvites, fetchIncomingInvites]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to send invite");
        return;
      }
      
      const data = await res.json();
      const fullLink = `${window.location.origin}${data.inviteLink}`;
      setInviteLink(fullLink);
      setInviteEmail("");
      setShowInviteModal(false);
      setShowInviteLinkModal(true);
      fetchInvites();
    } catch {
      alert("Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      
      if (!res.ok) {
        alert("Failed to update team");
        return;
      }
      
      setShowEditModal(false);
      fetchTeam();
    } catch {
      alert("Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    
    try {
      const res = await fetch(`/api/team/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
        return;
      }
      
      fetchTeam();
    } catch {
      alert("Failed to remove member");
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update role");
        return;
      }
      
      fetchTeam();
    } catch {
      alert("Failed to update role");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Cancel this invite?")) return;
    
    try {
      const res = await fetch(`/api/team/invites?inviteId=${inviteId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchInvites();
      }
    } catch {
      alert("Failed to cancel invite");
    }
  };

  const canManage = team?.currentUserRole === "owner" || team?.currentUserRole === "admin";
  const isOwner = team?.currentUserRole === "owner";

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">👥</div>
          <p className="text-text-dim">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-accent-warning">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Incoming Invites Banner */}
        {incomingInvites.length > 0 && (
          <div className="mb-6 space-y-3">
            {incomingInvites.map((invite) => (
              <div
                key={invite.id}
                className="glass-panel p-4 rounded-xl border-2 border-accent-primary/50 bg-accent-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">✉️</span>
                      <span className="font-semibold text-text-bright">
                        You're invited to join {invite.teamName}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">
                      {invite.invitedByName} invited you as {invite.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite.token)}
                      disabled={isAcceptingInvite === invite.token}
                      className="px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isAcceptingInvite === invite.token ? "Joining..." : "Accept"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-stellar text-text-stellar mb-2">{team?.name}</h1>
            <p className="text-moon text-text-dim">
              {team?.description || "Your team workspace"}
            </p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright hover:border-accent-primary/50 transition-colors"
                >
                  Edit Team
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-accent-primary/20 text-accent-primary border border-accent-primary/50 rounded-lg hover:bg-accent-primary/30 transition-colors"
                >
                  + Invite
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="glass-panel p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold text-text-bright mb-4">
            Members ({team?.members.length})
          </h2>
          
          <div className="space-y-3">
            {team?.members.map((member) => {
              const roleStyle = roleColors[member.role] ?? roleColors.member!;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-void-deep/50 rounded-lg"
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                    style={{
                      backgroundColor: `${member.energySignatureColor}20`,
                      color: member.energySignatureColor,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-bright truncate">
                        {member.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full capitalize ${roleStyle.bg} ${roleStyle.text}`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <div className="text-sm text-text-muted truncate">
                      {member.email}
                    </div>
                    {member.userRole && (
                      <div className="text-xs text-text-dim">{member.userRole}</div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {isOwner && member.role !== "owner" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="px-2 py-1 text-sm bg-void-atmosphere border border-void-atmosphere rounded text-text-bright"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="p-2 text-text-muted hover:text-accent-warning transition-colors"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Invites */}
        {canManage && (
          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-text-bright mb-4">
              Pending Invites ({invites.length})
            </h2>
            
            {invites.length > 0 ? (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 bg-void-deep/50 rounded-lg"
                  >
                    <div>
                      <div className="text-text-bright">{invite.email}</div>
                      <div className="text-sm text-text-muted">
                        Invited as {invite.role} by {invite.invitedBy.name}
                      </div>
                      <div className="text-xs text-text-dim">
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="px-3 py-1 text-sm border border-void-atmosphere rounded text-text-muted hover:text-accent-warning hover:border-accent-warning transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">
                No pending invites. Click "+ Invite" to invite team members.
              </p>
            )}
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold text-text-bright mb-4">
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright placeholder-text-dim focus:outline-none focus:border-accent-primary"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!inviteEmail.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold text-text-bright mb-4">
                Edit Team
              </h2>
              <form onSubmit={handleUpdateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-void-deep border border-void-atmosphere rounded-lg text-text-bright focus:outline-none focus:border-accent-primary resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editName.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invite Link Modal */}
        {showInviteLinkModal && (
          <div className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 rounded-xl w-full max-w-md">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">✉️</div>
                <h2 className="text-xl font-semibold text-text-bright">
                  Invite Sent!
                </h2>
              </div>
              <p className="text-text-muted text-sm mb-4 text-center">
                Share this link with your teammate:
              </p>
              <div className="bg-void-deep p-3 rounded-lg mb-4">
                <code className="text-accent-primary text-sm break-all">
                  {inviteLink}
                </code>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert("Link copied to clipboard!");
                  }}
                  className="flex-1 px-4 py-2 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowInviteLinkModal(false)}
                  className="flex-1 px-4 py-2 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
