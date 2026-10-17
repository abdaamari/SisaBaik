"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
  rememberMe: z.boolean().optional(),
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
        toast.error(`Gagal masuk: ${authError.message}`);
        return;
      }

      if (authData.user) {
        toast.success('Berhasil masuk!');
        // After successful sign‑in, decide where to send the user based on their role.
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
              <span className="font-heading text-[14px] font-normal tracking-tight">S</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-normal leading-tight tracking-tight mb-4">
              Masuk ke SisaBaik
            </h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto">
              Masukkan email dan password Anda untuk mengakses akun dan mengelola donasi.
            </p>
          </div>

          <Card>
            <CardContent className="p-8 md:p-10 space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-lg border input bg-card">
                            <Mail className="h-4 w-4 text-muted-foreground ml-3" />
                            <Input
                              type="email"
                              placeholder="nama@contoh.com"
                              className="pl-3"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-medium">Password</FormLabel>
                        </div>
                        <FormControl>
                          <div className="flex items-center rounded-lg border input bg-card">
                            <Lock className="h-4 w-4 text-muted-foreground ml-3" />
                            <Input
                              type="password"
                              placeholder="Masukkan password"
                              className="pl-3"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-3">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              className="h-4 w-4 text-primary"
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-muted-foreground ml-2 cursor-select-none">
                            Ingatkan saya
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Masuk Sekarang
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    atau lanjutkan dengan
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  Google
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <a href="/register" className="text-primary font-medium hover:underline">
                  Daftar di sini
                </a>
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Lupa password?{' '}
            <a href="#" className="text-primary font-medium hover:underline">
              Reset password
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
