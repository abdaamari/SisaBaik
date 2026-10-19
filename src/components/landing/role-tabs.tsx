"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Only what the product really does today. Features that do not exist yet are not promised here.
const ROLES = [
  {
    id: "provider",
    label: "Penyedia makanan",
    who: "Restoran, katering, toko roti, hotel, dan kantin.",
    steps: [
      {
        title: "Catat donasi",
        text: "Isi nama makanan, jumlah, batas layak konsumsi, dan alamat penjemputan.",
      },
      {
        title: "Pantau klaim",
        text: "Lihat kapan donasi Anda diambil mitra terverifikasi dan sampai di mana prosesnya.",
      },
      {
        title: "Batalkan bila perlu",
        text: "Selama belum diklaim, donasi bisa dibatalkan kapan saja.",
      },
    ],
  },
  {
    id: "partner",
    label: "Mitra penyalur",
    who: "Yayasan, bank makanan, LSM, dan komunitas.",
    steps: [
      {
        title: "Daftar dan diverifikasi",
        text: "Admin memeriksa organisasi Anda sebelum tombol klaim dibuka.",
      },
      {
        title: "Cari dan klaim",
        text: "Telusuri donasi yang tersedia, lihat sisa waktunya, lalu klaim yang bisa Anda jemput.",
      },
      {
        title: "Antar dan konfirmasi",
        text: "Tandai pengiriman saat berangkat, lalu tandai selesai saat makanan sampai.",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    who: "Pengelola platform.",
    steps: [
      {
        title: "Tinjau pendaftar",
        text: "Lihat mitra yang menunggu verifikasi, lengkap dengan jenis dan alamat organisasinya.",
      },
      {
        title: "Verifikasi mitra",
        text: "Setujui mitra yang layak supaya mereka bisa mulai mengklaim donasi.",
      },
    ],
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

/** Tabs with the keyboard behaviour screen-reader users expect: arrows move, Tab leaves. */
export function RoleTabs() {
  const [active, setActive] = useState<RoleId>("provider");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = ROLES.findIndex((r) => r.id === active);
  const role = ROLES[activeIndex];

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % ROLES.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + ROLES.length) % ROLES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ROLES.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setActive(ROLES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:gap-6">
      <div role="tablist" aria-label="Pilih peran" aria-orientation="vertical" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ROLES.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`peran-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="peran-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "h-14 shrink-0 rounded-full px-6 text-left text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-full",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-accent",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="peran-panel"
        aria-labelledby={`peran-tab-${role.id}`}
        tabIndex={0}
        className="rounded-3xl bg-secondary p-6 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-8"
      >
        <h3 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">{role.label}</h3>
        <p className="mt-1 text-base text-muted-foreground">{role.who}</p>
        <ul className="mt-6 space-y-5">
          {role.steps.map((step) => (
            <li key={step.title}>
              <p className="text-base font-bold text-foreground">{step.title}</p>
              <p className="mt-0.5 max-w-[56ch] text-base leading-relaxed text-foreground/80">{step.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
