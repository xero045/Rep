import { ArrowLeft, FileWarning, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[62dvh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 text-center shadow-xs" data-testid="state-not-found">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"><FileWarning size={21} /></div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[.17em] text-primary">Evidence service / 404</div>
        <h1 className="font-serif text-2xl font-extrabold tracking-[-.04em]">This record is out of scope.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">The address does not point to a workspace view or verification report.</p>
        <Link href="/" className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="link-return-overview"><ShieldCheck size={14} /> Return to overview <ArrowLeft size={13} /></Link>
      </div>
    </div>
  );
}
