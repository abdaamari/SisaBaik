"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

const donationSchema = z.object({
  food_name: z.string().min(2, 'Nama makanan minimal 2 karakter'),
  category: z.string().min(1, 'Kategori harus dipilih'),
  quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Jumlah harus lebih dari 0'),
  unit: z.string().min(1, 'Satuan harus diisi'),
  expiry_time: z.string().min(1, 'Batas kelayakan harus diisi'),
  pickup_address: z.string().min(5, 'Alamat pengambilan minimal 5 karakter'),
  description: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

const categories = [
  'Makanan Berat',
  'Roti/Kue',
  'Minuman',
  'Buah/Sayur',
  'Lainnya',
];

const units = [
  'porsi',
  'buah',
  'gelas',
  'potong',
  'kg',
  'ons',
];

export default function NewDonationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      food_name: '',
      category: '',
      quantity: '',
      unit: 'porsi',
      expiry_time: '',
      pickup_address: '',
      description: '',
    },
  });

  const onSubmit = async (data: DonationFormData) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      const { error } = await supabase
        .from('donations')
        .insert({
          provider_id: user.id,
          food_name: data.food_name,
          category: data.category,
          quantity: parseInt(data.quantity),
          unit: data.unit,
          expiry_time: data.expiry_time,
          pickup_address: data.pickup_address,
          description: data.description || null,
          status: 'available',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

      if (error) throw error;

      toast.success('Donasi berhasil dibuat');
      router.push('/provider/donations');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Gagal membuat donasi');
      } else {
        toast.error('Gagal membuat donasi');
      }
      console.error('Create donation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/provider/donations">
          <Button variant="outline" size="sm" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-[28px] font-normal leading-none tracking-tight text-foreground">
            Buat Donasi Baru
          </h1>
          <p className="mt-1.5 max-w-[60ch] text-sm leading-6 text-muted-foreground">
            Isi detail donasi makanan berlebih Anda — status awal tetap
            tersedia dan hanya milik akun Anda.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="font-heading text-[20px] font-normal">
            Informasi Donasi
          </CardTitle>
          <CardDescription>
            Pastikan semua informasi akurat dan lengkap. Tujuh field di bawah
            ini adalah kontrak data yang dipertahankan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Food Name */}
              <FormField
                control={form.control}
                name="food_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Makanan *</FormLabel>
                    <FormControl>
                      <Inpu
                        placeholder="Contoh: Nasi Goreng Spesial"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah *</FormLabel>
                      <FormControl>
                        <Inpu
                          type="number"
                          placeholder="Contoh: 50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Unit and Expiry Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batas Kelayakan *</FormLabel>
                      <FormControl>
                        <Inpu
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pickup Address */}
              <FormField
                control={form.control}
                name="pickup_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Pengambilan *</FormLabel>
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Kondisi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Makanan masih panas, siap dikonsumsi"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Foto & peta pickup — konsep desain tidak aktif pada Fase 2. Tidak ada upload foto,
                  izin lokasi, atau pemanggilan map API; tidak ada field database baru.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Link href="/provider/donations">
                  <Button variant="outline" type="button" disabled={isLoading}>
                    Batal
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Buat Donasi
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}