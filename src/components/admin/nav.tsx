"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <aside className="admin-nav">
      <Link href="/admin/dashboard" className="brand">
        <Image src="/assets/logo-branca.png" width={38} height={38} alt="" />
        Painel
      </Link>
      <nav aria-label="Painel">
        {[
          ["dashboard", "Dashboard"],
          ["clientes", "Clientes"],
          ["propostas", "Propostas"],
          ["catalogo", "Catálogo"],
          ["agenda", "Agenda"],
          ["notas", "Notas"],
          ["pdf", "PDF"],
        ].map(([route, label]) => (
          <Link
            key={route}
            aria-current={
              pathname.startsWith(`/admin/${route}`) ? "page" : undefined
            }
            href={`/admin/${route}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <span>{name}</span>
      <Link href="/">Portfólio ↗</Link>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/auth/logout", {});
            router.push("/login");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        Sair
      </button>
      <p role="alert">{error}</p>
    </aside>
  );
}
