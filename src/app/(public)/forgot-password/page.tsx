"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email harus diisi").email("Format email belum benar"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Do not expose whether an address exists. Errors use generic copy too.
        toast.error("Tautan reset belum dapat dikirim. Coba lagi beberapa saat.");
        return;
      }

      toast.success(
        "Jika email terdaftar, kami akan mengirimkan tautan untuk mengatur ulang password Anda.",
        { duration: 6000 },
      );
    } catch {
      toast.error("Terjadi gangguan jaringan. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Lupa Password?"
      description="Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda."
      footer={
        <Link
          href="/login"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Kembali ke login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nama@contoh.com"
                      className="pl-10"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isLoading ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
