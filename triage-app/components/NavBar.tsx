import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/intake", label: "Intake" },
  { href: "/queue", label: "Queue" },
];

export function NavBar() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <span className="text-sm font-semibold">Northstar Triage</span>
        <ul className="flex gap-4 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-foreground/70 hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
