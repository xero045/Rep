import { ArrowRight, CalendarDays, Check, LoaderCircle, MapPin, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useCreateVerificationRun } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetVerificationSummaryQueryKey, getListVerificationRunsQueryKey } from '@workspace/api-client-react';

export function LaunchVerification({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const create = useCreateVerificationRun();
  const [form, setForm] = useState({ geography: '', indicator: '', period: '', anchor: true });
  if (!open) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ data: form }, {
      onSuccess: (run) => {
        queryClient.invalidateQueries({ queryKey: getGetVerificationSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVerificationRunsQueryKey({ limit: 4 }) });
        onOpenChange(false);
        setLocation(`/runs/${run.id}`);
      },
    });
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172235]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" data-testid="dialog-launch-verification"><div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl sm:p-7"><div className="mb-6 flex items-start justify-between"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-primary">New evidence run</div><h2 className="font-serif text-2xl font-extrabold tracking-[-.04em]">Launch a verification</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">We will query configured sources, compare records, and create a report.</p></div><button onClick={() => onOpenChange(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close launch dialog" data-testid="button-close-launch"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold"><MapPin size={14} className="text-primary" /> Geography</span><input required minLength={2} value={form.geography} onChange={e => setForm({ ...form, geography: e.target.value })} placeholder="e.g. Ghana" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/55 focus:ring-3" data-testid="input-geography" /></label><label className="block"><span className="mb-2 text-xs font-bold">Indicator</span><input required minLength={2} value={form.indicator} onChange={e => setForm({ ...form, indicator: e.target.value })} placeholder="e.g. Confirmed measles cases" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/55 focus:ring-3" data-testid="input-indicator" /></label><label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold"><CalendarDays size={14} className="text-primary" /> Reporting period</span><input required minLength={4} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. 2024-W18 or 2024-04" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/55 focus:ring-3" data-testid="input-period" /></label><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 p-3"><input type="checkbox" checked={form.anchor} onChange={e => setForm({ ...form, anchor: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" data-testid="input-anchor" /><span><span className="block text-xs font-bold">Anchor content hash</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Write the report fingerprint to Polygon Amoy testnet.</span></span></label>{create.isError && <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive" data-testid="text-create-error">Verification could not be launched. Check the inputs and source availability.</div>}<button disabled={create.isPending} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-verification">{create.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Comparing sources…</> : <><Check size={16} /> Start comparison <ArrowRight size={15} /></>}</button></form></div></div>;
}