import { ChevronRight } from 'lucide-react';

// Questions people ask, answered in plain words. Native <details>, so it works without JavaScript.
export default function Faq({ items }) {
  if (!items?.length) return null;
  return (
    <section className="space-y-4" aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-bold">Questions people ask</h2>
      <div className="divide-y divide-line rounded-2xl border border-line bg-paper">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <p className="mt-2 max-w-prose text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
