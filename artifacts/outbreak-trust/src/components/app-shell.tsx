import { Activity, ArrowUpRight, Blocks, BookOpenCheck, CircleHelp, Database, LayoutDashboard, Menu, Network, ShieldCheck, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/runs', label: 'Verification runs', icon: BookOpenCheck },
  { href: '/sources', label: 'Sources & chain', icon: Network },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="noise-overlay min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[88px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck size={20} strokeWidth={2.3} />
            </div>
            <div>
              <div className="font-serif text-[17px] font-extrabold tracking-[-.03em]">Outbreak Trust</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Evidence service</div>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" aria-label="Close navigation" data-testid="button-close-navigation">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.17em] text-sidebar-foreground/40">Workspace</div>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                  <Icon size={17} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-primary'} />
                  <span>{label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto px-4 pb-5">
          <div className="mb-5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-sidebar-foreground/80"><Activity size={13} className="text-sidebar-primary" /> Network posture</div>
            <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/50"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary pulse-soft" /> Polygon Amoy testnet</div>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9a45f] text-[11px] font-bold text-[#252d3a]">OT</div>
            <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold">Operations desk</div><div className="truncate text-[10px] text-sidebar-foreground/45">Institution workspace</div></div>
            <CircleHelp size={15} className="text-sidebar-foreground/40" />
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-[#172235]/45 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" data-testid="button-navigation-overlay" />}
      <div className="md:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-border bg-card p-2 md:hidden" aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={17} /></button>
            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground sm:flex"><Database size={13} /> Public-health evidence / <span className="text-foreground">Live workspace</span></div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">Last system check</span>
            <span className="font-mono text-foreground">14:32 UTC</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-12">{children}</main>
        <footer className="mx-auto flex max-w-[1480px] items-center justify-between border-t border-border/70 px-5 py-6 text-[10px] text-muted-foreground sm:px-8 lg:px-12">
          <span className="font-mono uppercase tracking-[.12em]">OT / Evidence you can retrace</span>
          <a className="flex items-center gap-1 hover:text-primary" href="https://amoy.polygonscan.com" target="_blank" rel="noreferrer" data-testid="link-polygon-footer">Polygon Amoy explorer <ArrowUpRight size={12} /></a>
        </footer>
      </div>
    </div>
  );
}