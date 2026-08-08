import Link from "next/link";
import { logout } from "@/app/login/actions";
import { RefreshButton } from "./RefreshButton";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/speakers", label: "Speakers" },
  { href: "/talks", label: "Charlas" },
  { href: "/agenda", label: "Agenda" },
  { href: "/perfiles", label: "Perfiles" },
  { href: "/pendientes", label: "Pendientes" },
];

export function NavBar() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg font-extrabold tracking-tight text-purple">
            DD
          </span>
          <nav className="flex flex-wrap gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-purple-wash"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
          <form action={logout}>
            <button className="rounded-full border border-line px-4 py-2 text-sm font-medium text-mute transition-colors hover:border-purple hover:text-purple">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
