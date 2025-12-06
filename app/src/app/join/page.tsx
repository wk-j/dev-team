"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface InviteInfo {
  teamName: string;
  invitedBy: string;
  role: string;
  email: string;
  expiresAt: string;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided");
      setIsLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`/api/join?token=${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid or expired invite");
          return;
        }
        const data = await res.json();
        setInvite(data);
      } catch {
        setError("Failed to load invite");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invite");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/observatory");
      }, 2000);
    } catch {
      setError("Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">✉️</div>
          <p className="text-text-dim">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold text-text-bright mb-2">
            Welcome to the team!
          </h1>
          <p className="text-text-muted">Redirecting to Observatory...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-text-bright mb-2">
            Invalid Invite
          </h1>
          <p className="text-text-muted mb-6">
            {error || "This invite link is invalid or has expired."}
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invite.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-void-deep flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✨</div>
          <h1 className="text-2xl font-semibold text-text-bright mb-2">
            You're Invited!
          </h1>
          <p className="text-text-muted">
            {invite.invitedBy} invited you to join
          </p>
        </div>

        <div className="bg-void-deep/50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-xl font-semibold text-accent-primary mb-1">
              {invite.teamName}
            </div>
            <div className="text-sm text-text-muted">
              Role: <span className="capitalize">{invite.role}</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-text-dim mb-6">
          <p>Invite sent to: <span className="text-text-bright">{invite.email}</span></p>
          <p>
            Expires:{" "}
            <span className={isExpired ? "text-accent-warning" : "text-text-bright"}>
              {new Date(invite.expiresAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        {isExpired ? (
          <div className="text-center">
            <p className="text-accent-warning mb-4">This invite has expired.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 border border-void-atmosphere rounded-lg text-text-muted hover:text-text-bright transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full px-6 py-3 bg-accent-primary text-void-deep rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              {isAccepting ? "Joining..." : "Accept & Join Team"}
            </button>
            <Link
              href="/login"
              className="block w-full px-6 py-3 border border-void-atmosphere rounded-lg text-center text-text-muted hover:text-text-bright transition-colors"
            >
              Cancel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void-deep flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-4xl mb-4">✉️</div>
            <p className="text-text-dim">Loading invite...</p>
          </div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
