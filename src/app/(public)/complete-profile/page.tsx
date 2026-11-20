"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Check, Handshake, Store } from "lucide-react";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Textarea } from "@/components/ui/textarea";
import { REGISTRATION_ROLES } from "@/lib/registration-options";
import { registerSchema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const profileSchema = registerSchema.omit({ email: true, password: true });

export default function CompleteProfile() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"provider" | "partner" | "">("");
  const [organizationType, setOrganizationType] = useState("");
  const roleConfig = REGISTRATION_ROLES.find(option => option.value === role);
  useEffect(() => {
    let active = true;
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (error) { toast.error("Profil gagal dimuat. Muat ulang halaman untuk mencoba lagi."); return; }
      const profile = data as { role: string } | null;
      if (profile && ["admin", "provider", "partner"].includes(profile.role)) {
        router.replace(`/${profile.role}/dashboard`);
      } else if (active) setReady(true);
    }
    void check();
    return () => { active = false; };
  }, [router]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const result = profileSchema.safeParse({
      role, organization_type: organizationType,
      organization_name: values.get("name"), phone: values.get("phone"), address: values.get("address"),
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createClient().rpc("complete_google_profile", {
        p_role: result.data.role, p_name: result.data.organization_name, p_type: result.data.organization_type ?? "",
        p_phone: result.data.phone ?? "", p_address: result.data.address,
      } as never);
      if (error) { toast.error(error.message); return; }
      if (typeof data === "string" && ["provider", "partner", "admin"].includes(data)) {
        router.replace(`/${data}/dashboard`);
        router.refresh();
      }
    } catch { toast.error("Profil gagal disimpan. Silakan coba lagi."); }
    finally { setSaving(false); }
  }
  return <AuthShell title="Lengkapi profil Anda" description="Pilih peran dan isi informasi organisasi untuk mulai menggunakan SisaBaik.">
    {!ready ? <p role="status">Memuat profil…</p> : <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <span className="text-sm font-medium">Saya mendaftar sebagai</span>
        <div role="radiogroup" aria-label="Peran" className="grid gap-3 sm:grid-cols-2">
          {REGISTRATION_ROLES.map(option => {
            const selected = role === option.value;
            const Icon = option.value === "provider" ? Store : Handshake;
            return <button key={option.value} type="button" role="radio" aria-checked={selected}
              onClick={() => { if (role !== option.value) setOrganizationType(""); setRole(option.value); }}
              className={cn("relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", selected ? "border-primary bg-fresh-soft" : "border-border bg-card hover:border-primary/50")}>
              <span className={cn("flex size-10 items-center justify-center rounded-full", selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Icon className="size-5" aria-hidden="true" /></span>
              <span><span className="block font-bold text-foreground">{option.title}</span><span className="mt-1 block text-sm leading-snug text-muted-foreground">{option.text}</span></span>
              {selected && <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" aria-hidden="true" /></span>}
            </button>;
          })}
        </div>
      </div>
      <label className="block space-y-2"><span className="text-sm font-medium">Nama organisasi</span>
        <Input name="name" required minLength={2} maxLength={150} autoComplete="organization" placeholder="Contoh: Resto Sejahtera" />
      </label>
      {roleConfig && <div className="space-y-2">
        <span className="text-sm font-medium">Jenis organisasi <span className="font-normal text-muted-foreground">(opsional)</span></span>
        <ChoiceChips label="Jenis organisasi" value={organizationType} onChange={setOrganizationType} options={roleConfig.types.map(type => ({ value: type, label: type }))} />
      </div>}
      <label className="block space-y-2"><span className="text-sm font-medium">Nomor telepon <span className="font-normal text-muted-foreground">(opsional)</span></span>
        <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="+62 812-3456-7890" />
      </label>
      <label className="block space-y-2"><span className="text-sm font-medium">Alamat lengkap</span>
        <Textarea name="address" required minLength={5} maxLength={1000} autoComplete="street-address" placeholder="Jl. Contoh No. 123, Kota, Provinsi" className="min-h-20 resize-none" />
      </label>
      <p className="text-sm text-muted-foreground">Akun mitra memerlukan verifikasi admin sebelum dapat mengklaim donasi.</p>
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan…" : "Simpan dan lanjutkan"}</Button>
    </form>}
  </AuthShell>;
}
