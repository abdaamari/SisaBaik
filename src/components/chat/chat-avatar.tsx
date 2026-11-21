"use client";

import { useState } from "react";

export interface ChatProfile {
  id: string;
  full_name: string | null;
  organization_name: string;
  avatar_url: string | null;
  role: string;
}

export function profileName(profile?: ChatProfile) {
  return profile?.full_name || profile?.organization_name || "Pengguna";
}

export function ChatAvatar({ profile, label }: { profile?: ChatProfile; label: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const name = profile ? profileName(profile) : label;
  return <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-secondary-foreground" aria-label={name}>
    {profile?.avatar_url && failedUrl !== profile.avatar_url
      // User-uploaded avatar URLs are already served by Supabase Storage.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={profile.avatar_url} alt="" className="size-full object-cover" onError={() => setFailedUrl(profile.avatar_url)} />
      : name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}
  </span>;
}
