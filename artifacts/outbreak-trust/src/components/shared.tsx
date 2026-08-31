import { AlertTriangle, Blocks, ChevronRight, Clock3, Database, ExternalLink, FileWarning, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { SourceResult, SourceStatus, VerificationRun } from '@workspace/api-client-react';
import { Link } from 'wouter';

export function formatDate(value?: string | null, withTime = true) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}) }).format(date);
}

export function shortHash(value?: string | null) {
  if (!value) return 'Not anchored';
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    anchored: { label: 'Anchored', className: 'border-primary/25 bg-primary/10 text-primary' },
    verified: { label: 'Verified', className: 'border-primary/25 bg-primary/10 text-primary' },
    matched: { label: 'Matched', className: 'border-primary/25 bg-primary/10 text-primary' },
    connected: { label: 'Connected', className: 'border-primary/25 bg-primary/10 text-primary' },
    'needs-review': { label: 'Needs review', className: 'border-[#d6a153]/35 bg-[#d6a153]/12 text-[#986824]' },
    pending: { label: 'Pending', className: 'border-[#d6a153]/35 bg-[#d6a153]/12 text-[#986824]' },
    diverged: { label: 'Diverged', className: 'border-[#c66b4d]/30 bg-[#c66b4d]/10 text-[#a5482e]' },
    failed: { label: 'Failed', className: 'border-destructive/25 bg-destructive/10 text-destructive' },
    unavailable: { label: 'Unavailable', className: 'border-muted-foreground/25 bg-muted text-muted-foreground' },
    demo: { label: 'Demo data', className: 'border-[#8393a8]/35 bg-[#8393a8]/10 text-[#627388]' },
  };
  const item = config[status] ?? { label: status, className: 'border-border bg-muted text-muted-foreground' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.05em] ${item.className}`} data-testid={`status-pill-${status}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{item.label}</span>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-9 flex flex-col justify-between gap-5 border-b border-border/80 pb-7 md:flex-row md:items-end">
    <div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary"><span className="h-px w-6 bg-primary" />{eyebrow}</div><h1 className="font-serif text-3xl font-extrabold tracking-[-.045em] text-foreground sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-[14px] leading-6 text-muted-foreground">{description}</p></div>
    {action}
  </div>;
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" data-testid="state-loading"><div className="h-3 w-28 animate-pulse rounded bg-muted" />{Array.from({ length: count }).map((_, i) => <div key={i} className="h-[62px] animate-pulse rounded-xl bg-muted" />)}</div>;
}

export function QueryState({ kind, onRetry, message }: { kind: 'error' | 'empty'; onRetry?: () => void; message?: string }) {
  if (kind === 'empty') return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 text-center" data-testid="state-empty"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><FileWarning size={19} /></div><h3 className="font-serif text-lg font-bold">No evidence runs yet</h3><p className="mt-2 max-w-sm text-sm leading-5 text-muted-foreground">{message ?? 'Launch a verification to create the first traceable comparison.'}</p></div>;
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-[#c66b4d]/30 bg-[#c66b4d]/5 px-6 text-center" data-testid="state-error"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#c66b4d]/10 text-[#a5482e]"><AlertTriangle size={19} /></div><h3 className="font-serif text-lg font-bold">Evidence service unavailable</h3><p className="mt-2 max-w-sm text-sm leading-5 text-muted-foreground">{message ?? 'We could not retrieve this workspace right now. No verification claim has been made.'}</p>{onRetry && <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted" data-testid="button-retry"><RefreshCw size={13} /> Try again</button>}</div>;
}

export function RunRow({ run }: { run: VerificationRun }) {
  return <Link href={`/runs/${run.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-border/80 bg-card px-4 py-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:grid-cols-[1.2fr_1fr_.8fr_auto_auto]" data-testid={`row-run-${run.id}`}>
    <div className="min-w-0"><div className="truncate text-[13px] font-bold">{run.indicator}</div><div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.04em] text-muted-foreground"><span>{run.geography}</span><span className="text-border">/</span><span>{run.period}</span></div></div>
    <div className="hidden min-w-0 sm:block"><div className="truncate text-xs font-semibold">{run.recordsCompared.toLocaleString()} records</div><div className="mt-1 text-[10px] text-muted-foreground">Compared across sources</div></div>
    <div className="hidden sm:block"><div className="font-mono text-[13px] font-medium">{run.agreement.toFixed(1)}%</div><div className="mt-1 text-[10px] text-muted-foreground">Agreement</div></div>
    <StatusPill status={run.status} />
    <ChevronRight size={16} className="text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
  </Link>;
}

export function SourceCard({ source, compact = false }: { source: SourceStatus; compact?: boolean }) {
  const Icon = source.kind === 'chain' ? Blocks : source.id.toLowerCase().includes('who') ? ShieldCheck : Database;
  return <div className={`rounded-xl border border-border/80 bg-card p-4 shadow-xs ${compact ? '' : 'sm:p-5'}`} data-testid={`card-source-${source.id}`}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${source.kind === 'chain' ? 'bg-[#d6a153]/15 text-[#986824]' : 'bg-primary/10 text-primary'}`}><Icon size={17} /></div><div><div className="text-[13px] font-bold">{source.label}</div><div className="mt-0.5 font-mono text-[10px] uppercase tracking-[.06em] text-muted-foreground">{source.kind === 'chain' ? source.network ?? 'Chain' : 'Data source'}</div></div></div><StatusPill status={source.status} /></div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">{source.detail}</p>
    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 size={12} /> Checked {formatDate(source.lastCheckedAt)}</span>{source.explorerUrl && <a href={source.explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline" data-testid={`link-source-explorer-${source.id}`}>Explorer <ExternalLink size={11} /></a>}</div>
  </div>;
}

export function SourceResultRow({ result }: { result: SourceResult }) {
  return <div className="grid gap-3 border-b border-border/70 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center" data-testid={`row-source-result-${result.source.replaceAll(' ', '-').toLowerCase()}`}>
    <div><div className="flex items-center gap-2 text-[13px] font-bold"><span className="h-2 w-2 rounded-full bg-primary" />{result.source}</div><div className="mt-1 text-[11px] text-muted-foreground">{result.note}</div></div>
    <div className="font-mono text-sm font-medium sm:text-right">{result.value === null ? '—' : `${result.value.toLocaleString()} ${result.unit}`}</div>
    <StatusPill status={result.status} />
  </div>;
}

export function ProofMark({ anchored }: { anchored: boolean }) {
  return <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold ${anchored ? 'border-primary/25 bg-primary/8 text-primary' : 'border-border bg-muted text-muted-foreground'}`} data-testid="status-proof-mark">{anchored ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}{anchored ? 'Content hash anchored' : 'No chain proof recorded'}</div>;
}