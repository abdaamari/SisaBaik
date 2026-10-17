"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Building } from 'lucide-react';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'provider' | 'partner' | null>(null);
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

  const handleRoleSelect = (role: 'provider' | 'partner') => {
    setSelectedRole(role);
    form.setValue('role', role);
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
              Daftar Akun Baru
            </h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto">
              Bergabunglah dengan SisaBaik sebagai penyedia makanan atau mitra penyalur terverifikasi.
            </p>
          </div>

          <Card>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Pilih Peran Anda</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={selectedRole === 'provider' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => handleRoleSelect('provider')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Penyedia Makanan</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Restoran, katering, toko roti, hotel, kantin yang memiliki surplus makanan
                  </p>
                </Button>

                <Button
                  type="button"
                  variant={selectedRole === 'partner' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => handleRoleSelect('partner')}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Mitra Penyalur</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    LSM, bank makanan, yayasan, komunitas yang menyalurkan makanan
                  </p>
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Organization Name */}
                <FormField
                  control={form.control}
                  name="organization_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Organisasi *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Resto Sejahtera" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Organization Type */}
                <FormField
                  control={form.control}
                  name="organization_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Organisasi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis organisasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Restoran">Restoran</SelectItem>
                          <SelectItem value="Katering">Katering</SelectItem>
                          <SelectItem value="Toko Roti">Toko Roti</SelectItem>
                          <SelectItem value="Hotel">Hotel</SelectItem>
                          <SelectItem value="Kantin">Kantin</SelectItem>
                          <SelectItem value="LSM">LSM</SelectItem>
                          <SelectItem value="Bank Makanan">Bank Makanan</SelectItem>
                          <SelectItem value="Yayasan">Yayasan</SelectItem>
                          <SelectItem value="Komunitas">Komunitas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="+62 812-3456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Lengkap *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nama@contoh.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimal 8 karakter"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar Sekarang
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Sudah punya akun?{' '}
                <a href="/login" className="text-green-600 hover:underline font-medium">
                  Masuk di sini
                </a>
              </p>
              <p className="mt-2">
                Catatan: Mitra penyalur perlu diverifikasi oleh admin sebelum dapat mengklaim donasi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </main>
  );
}