import { ArrowRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useListVerificationRuns, getListVerificationRunsQueryKey } from '@workspace/api-client-react';
import { PageIntro, LoadingRows, QueryState, RunRow } from '@/components/shared';

export default function Runs() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const runs = useListVerificationRuns({ limit: 50 }, { query: { queryKey: getListVerificationRunsQueryKey({ limit: 50 }) } });
  const filtered = useMemo(() => (runs.data ?? []).filter(run => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [run.geography, run.indicator, run.period, run.status].join(' ').toLowerCase().includes(query);
    return matchesSearch && (status === 'all' || run.status === status);
  }), [runs.data, search, status]);
  const statuses = ['all', 'anchored', 'verified', 'needs-review', 'failed'];

  return <div className="reveal-up">
    <PageIntro eyebrow="Evidence ledger" title="Verification runs" description="A searchable history of every comparison created in this workspace. Open a run to inspect the source records and its integrity proof." />
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search geography, indicator, period…" className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" data-testid="input-search-runs" /></div><div className="flex items-center gap-2 overflow-x-auto"><SlidersHorizontal size={15} className="ml-1 shrink-0 text-muted-foreground" /><span className="hidden text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground sm:inline">Status</span>{statuses.map(item => <button key={item} onClick={() => setStatus(item)} className={`shrink-0 rounded-md px-2.5 py-2 font-mono text-[10px] uppercase tracking-[.03em] ${status === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-filter-${item}`}>{item === 'all' ? 'All runs' : item.replace('-', ' ')}</button>)}</div></div>
    <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter size={14} /> {runs.data ? `${filtered.length} of ${runs.data.length} runs` : 'Loading runs'}</div><div className="font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground">Newest first</div></div>
    {runs.isLoading ? <LoadingRows count={6} /> : runs.isError ? <QueryState kind="error" onRetry={() => runs.refetch()} /> : filtered.length ? <div className="space-y-2.5">{filtered.map(run => <RunRow key={run.id} run={run} />)}</div> : runs.data?.length ? <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center" data-testid="state-no-search-results"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Search size={17} /></div><h3 className="font-serif text-lg font-bold">No matching runs</h3><p className="mt-2 text-sm text-muted-foreground">Try a different geography, indicator, or status.</p><button onClick={() => { setSearch(''); setStatus('all'); }} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid="button-clear-filters">Clear filters <ArrowRight size={13} /></button></div> : <QueryState kind="empty" />}
  </div>;
}