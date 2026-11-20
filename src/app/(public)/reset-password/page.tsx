"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type RecoveryStatus = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("checking");
  const supabase = createClient();
  const verifiedRecoveryEvent = useRef(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const tokenHash = url.searchParams.get("token_hash");
    const otpType = url.searchParams.get("type");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        verifiedRecoveryEvent.current = true;
        if (active) setRecoveryStatus("ready");
      }
    });

    const validateRecoverySession = async () => {
      if (tokenHash && otpType === "recovery") {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (!active) return;
        if (error || !data.session) {
          setRecoveryStatus("invalid");
          return;
        }

        // Remove one-time credentials from the URL after Supabase exchanges them.
        window.history.replaceState(null, "", `${url.pathname}`);
        setRecoveryStatus("ready");
        return;
      }

      const [
        { data: sessionData, error: sessionError },
        { data: userData, error: userError },
      ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);
      if (!active) return;

      if (
        !sessionError &&
        !userError &&
        sessionData.session &&
        userData.user &&
        verifiedRecoveryEvent.current
      ) {
        setRecoveryStatus("ready");
      } else {
        setRecoveryStatus("invalid");
      }
    };

    void validateRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    if (isLoading || recoveryStatus !== "ready") return;
    setIsLoading(true);

    try {
      const [
        { data: sessionData, error: sessionError },
        { data: userData, error: userError },
      ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);
      if (sessionError || userError || !sessionData.session || !userData.user) {
        setRecoveryStatus("invalid");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Password baru belum dapat disimpan. Coba lagi atau minta tautan reset baru.");
        return;
      }

      toast.success("Password berhasil diperbarui. Silakan masuk dengan password baru.");
      try {
        await supabase.auth.signOut();
      } catch {
        // Password update already succeeded; still continue to login.
      }
      router.replace("/login");
    } catch {
      toast.error("Terjadi gangguan jaringan. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (recoveryStatus === "checking") {
    return (
      <AuthShell title="Memeriksa tautan reset" description="Mohon tunggu sebentar.">
        <div className="flex justify-center py-6" role="status" aria-label="Memeriksa tautan">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      </AuthShell>
    );
  }

  if (recoveryStatus === "invalid") {
    return (
      <AuthShell
        title="Tautan reset tidak valid"
        description="Tautan reset password mungkin sudah kedaluwarsa atau sudah digunakan. Minta tautan baru untuk melanjutkan."
        footer={
          <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
            Kembali ke login
          </Link>
        }
      >
        <Link href="/forgot-password" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Minta tautan reset baru
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Buat Password Baru"
      description="Gunakan password baru dengan minimal 8 karakter."
      footer={
        <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
          Kembali ke login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password baru</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Minimal 8 karakter" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi password baru</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Ulangi password baru" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
