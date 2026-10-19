"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthShell } from '@/components/auth/auth-shell';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().min(1, 'Email harus diisi').email('Format email belum benar'),
  password: z.string().min(1, 'Password harus diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error(
          authError.message === 'Invalid login credentials'
            ? 'Email atau password salah. Periksa lagi lalu coba masuk.'
            : `Gagal masuk: ${authError.message}`,
        );
        return;
      }

      if (authData.user) {
        toast.success('Berhasil masuk!');
        // After successful sign-in, decide where to send the user based on their role.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single() as { data: { role: 'provider' | 'partner' | 'admin' } | null };
          const role = profileData?.role;
          if (role === 'admin') {
            router.push('/admin/verification');
          } else if (role === 'provider') {
            router.push('/provider/dashboard');
          } else if (role === 'partner') {
            router.push('/partner/dashboard');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } else {
        toast.error('Login gagal. Silakan coba lagi.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan mengelola donasi makanan Anda."
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-primary underline-offset-4 hover:underline">
            Daftar gratis
          </Link>
        </>
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
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="Masukkan password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isLoading ? 'Sedang masuk...' : 'Masuk'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
