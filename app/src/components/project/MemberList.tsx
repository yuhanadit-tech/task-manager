const ROLE_STYLES: Record<string, string> = {
  owner: "bg-[#ede9fe] text-[#5b21b6]",
  admin: "bg-[#dbeafe] text-[#1d4ed8]",
  member: "bg-[#f3f4f6] text-[#374151]",
};

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatarUrl: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  /** The role of the viewing user — controls whether remove/role actions appear */
  viewerRole: string;
}

export function MemberList({ members, viewerRole }: MemberListProps) {
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  return (
    <ul className="divide-y divide-[#e9ecef]">
      {members.map((m) => {
        const displayName = m.user.name ?? m.user.email;
        const initials = displayName.slice(0, 2).toUpperCase();
        const avatarSrc = m.user.image ?? m.user.avatarUrl;

        return (
          <li key={m.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="h-8 w-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-medium text-white">
                  {initials}
                </span>
              )}
              <div>
                <p className="text-sm font-medium text-[#1a1a2e]">{displayName}</p>
                <p className="text-xs text-[#6c757d]">{m.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[m.role] ?? ROLE_STYLES.member}`}
              >
                {m.role}
              </span>
              {canManage && m.role !== "owner" && (
                <span className="text-xs text-[#adb5bd]">— manage via API</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
