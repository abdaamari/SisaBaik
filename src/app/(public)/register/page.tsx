"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Handshake, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { AuthShell } from '@/components/auth/auth-shell';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Role = 'provider' | 'partner';

const ROLES: {
  value: Role;
  title: string;
  text: string;
  icon: React.ElementType;
  types: string[];
}[] = [
  {
    value: 'provider',
    title: 'Penyedia makanan',
    text: 'Punya makanan berlebih yang masih layak, dan ingin menyalurkannya.',
    icon: Store,
    types: ['Restoran', 'Katering', 'Toko Roti', 'Hotel', 'Kantin'],
  },
  {
    value: 'partner',
    title: 'Mitra penyalur',
    text: 'Menjemput dan menyalurkan makanan ke orang yang membutuhkan.',
    icon: Handshake,
    types: ['LSM', 'Bank Makanan', 'Yayasan', 'Komunitas'],
  },
];

const STEP_FIELDS = ['role', 'organization_name', 'organization_type', 'phone', 'address'] as const;
const STEP_LABELS = ['Tentang organisasi', 'Akun Anda'];

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
      organization_name: '',
      organization_type: '',
      phone: '',
      address: '',
      email: '',
      password: '',
    },
  });

  const selectedRole = form.watch('role');
  const roleConfig = ROLES.find((r) => r.value === selectedRole);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            organization_name: data.organization_name,
            organization_type: data.organization_type,
            phone: data.phone,
            address: data.address,
          },
        },
      });

      if (authError) {
        toast.error(`Gagal mendaftar: ${authError.message}`);
        return;
      }

      if (authData.user) {
        toast.success('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        router.push('/login');
      } else {
        toast.error('Pendaftaran gagal. Silakan coba lagi.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goNext = async () => {
    const valid = await form.trigger([...STEP_FIELDS]);
    if (valid) setStep(1);
  };

  // Enter on the first step moves forward instead of submitting a half-filled form.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (step === 0) {
      event.preventDefault();
      void goNext();
      return;
    }
    void form.handleSubmit(onSubmit)(event);
  };

  return (
    <AuthShell
      title="Buat akun SisaBaik"
      description="Gratis. Cukup dua langkah singkat."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <div className="mb-6" aria-label={`Langkah ${step + 1} dari 2: ${STEP_LABELS[step]}`} role="group">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEP_LABELS.map((label, index) => (
            <span
              key={label}
              className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', index <= step ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold text-muted-foreground" aria-hidden="true">
          Langkah {step + 1} dari 2 <span className="text-foreground">· {STEP_LABELS[step]}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
          {step === 0 && (
            <>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <span className="text-sm leading-none font-medium select-none">Saya mendaftar sebagai</span>
                    <div role="radiogroup" aria-label="Peran" className="grid gap-3 sm:grid-cols-2">
                      {ROLES.map((role) => {
                        const selected = field.value === role.value;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              field.onChange(role.value);
                              // The two roles offer different organization types.
                              if (field.value !== role.value) form.setValue('organization_type', '');
                            }}
                            className={cn(
                              'relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                              selected ? 'border-primary bg-fresh-soft' : 'border-border bg-card hover:border-primary/50',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-10 items-center justify-center rounded-full',
                                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                              )}
                            >
                              <role.icon className="size-5" aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block font-bold text-foreground">{role.title}</span>
                              <span className="mt-1 block text-sm leading-snug text-muted-foreground">{role.text}</span>
                            </span>
                            {selected && (
                              <span
                                className="absolute top-3 right-3 flex size-6 animate-settle items-center justify-center rounded-full bg-primary text-primary-foreground"
                                aria-hidden="true"
                              >
                                <Check className="size-3.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama organisasi</FormLabel>
                    <FormControl>
                      <Input autoComplete="organization" placeholder="Contoh: Resto Sejahtera" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {roleConfig && (
                <FormField
                  control={form.control}
                  name="organization_type"
                  render={({ field }) => (
                    <FormItem>
                      <span className="text-sm leading-none font-medium select-none">
                        Jenis organisasi <span className="font-normal text-muted-foreground">(opsional)</span>
                      </span>
                      <ChoiceChips
                        label="Jenis organisasi"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        options={roleConfig.types.map((type) => ({ value: type, label: type }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nomor telepon <span className="font-normal text-muted-foreground">(opsional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+62 812-3456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat lengkap</FormLabel>
                    <FormControl>
                      <Textarea
                        autoComplete="street-address"
                        placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                        className="min-h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" size="lg" className="w-full" onClick={() => void goNext()}>
                Lanjut
                <ArrowRight aria-hidden="true" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" inputMode="email" autoComplete="email" placeholder="nama@contoh.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" placeholder="Minimal 8 karakter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === 'partner' && (
                <p className="rounded-xl bg-soon-soft px-4 py-3 text-sm leading-relaxed text-soon-ink">
                  Mitra penyalur diverifikasi admin dulu sebelum bisa mengklaim donasi. Anda tetap bisa melihat donasi yang tersedia.
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" disabled={isLoading} onClick={() => setStep(0)}>
                  <ArrowLeft aria-hidden="true" />
                  Kembali
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {isLoading ? 'Mendaftarkan...' : 'Buat akun'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </AuthShell>
  );
}
