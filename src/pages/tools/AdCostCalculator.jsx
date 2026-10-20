import { useState, useId } from 'react';
import ToolFrame from '../../ui/ToolFrame';
import { Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'Are the "good" and "bad" hints reliable?',
    a: 'No, they are rough guides only. Costs differ a lot by country, industry, season and what you sell. A "bad" number for one shop can be great for another. Compare against your own past ads first.',
  },
  {
    q: 'What is the most important number?',
    a: 'If you sell something, ROAS and cost per sale. They tell you whether you make more money than you spend. Clicks and views matter only if they lead to sales.',
  },
  {
    q: 'Why are some boxes showing "needs..."?',
    a: 'Each number needs certain inputs. For example, cost per click needs both your spend and your clicks. Fill in what you know and the rest appear.',
  },
  {
    q: 'Does this include my product costs?',
    a: 'No. Profit here is revenue minus ad spend only. Your product, shipping and fees are not counted, so your real profit is lower.',
  },
];

const safeDiv = (a, b) => (b > 0 ? a / b : null);

// Pure maths. Any value that cannot be worked out (missing input or divide by zero) comes back as null.
function computeMetrics({ spend, impressions, clicks, conversions, revenue }) {
  return {
    ctr: safeDiv(clicks, impressions) === null ? null : (clicks / impressions) * 100,
    cpc: safeDiv(spend, clicks),
    cpm: safeDiv(spend, impressions) === null ? null : (spend / impressions) * 1000,
    cpa: safeDiv(spend, conversions),
    roas: safeDiv(revenue, spend),
    roi: spend > 0 ? ((revenue - spend) / spend) * 100 : null,
    convRate: safeDiv(conversions, clicks) === null ? null : (conversions / clicks) * 100,
  };
}

const parse = (v) => {
  if (v.trim() === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const fmt = (n, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

// Rough, general guides for Facebook and Instagram ads. They are not rules.
const METRICS = [
  {
    key: 'ctr', name: 'Click rate (CTR)', unit: '%', needs: 'impressions and clicks',
    meaning: 'Out of every 100 people who saw your ad, how many clicked it.',
    hint: (v) => (v < 0.5 ? ['bad', 'Low. The ad or the audience may not be catching attention.'] : v < 1 ? ['ok', 'Around average.'] : ['good', 'Healthy. Many ads land near 1% or more.']),
  },
  {
    key: 'cpc', name: 'Cost per click (CPC)', unit: '', needs: 'spend and clicks',
    meaning: 'What you pay each time someone clicks.',
    hint: (v) => (v > 2 ? ['bad', 'High for many shops, though it depends on your industry.'] : v > 1 ? ['ok', 'Around average.'] : ['good', 'Cheap clicks. Check they turn into sales.']),
  },
  {
    key: 'cpm', name: 'Cost per 1,000 views (CPM)', unit: '', needs: 'spend and impressions',
    meaning: 'What you pay to show your ad 1,000 times.',
    hint: (v) => (v > 20 ? ['bad', 'Expensive. You may be targeting a small or very competitive group.'] : v > 10 ? ['ok', 'Around average.'] : ['good', 'Cheap reach.']),
  },
  {
    key: 'cpa', name: 'Cost per sale (CPA)', unit: '', needs: 'spend and conversions',
    meaning: 'What you pay for each sale or sign-up.',
    hint: () => ['ok', 'No single good number. It is good if it is well below the profit you make on one sale.'],
  },
  {
    key: 'roas', name: 'Return on ad spend (ROAS)', unit: 'x', needs: 'spend and revenue',
    meaning: 'For every 1 you spend on ads, how much sales money comes back.',
    hint: (v) => (v < 1 ? ['bad', 'You get back less than you spend on ads.'] : v < 2 ? ['ok', 'Covers the ads, but little is left for product costs.'] : v < 4 ? ['good', 'A common healthy range.'] : ['good', 'Very strong.']),
  },
  {
    key: 'roi', name: 'Return on investment (ROI)', unit: '%', needs: 'spend and revenue',
    meaning: 'Your profit from the ads, as a percentage of what you spent. Product costs are not counted.',
    hint: (v) => (v < 0 ? ['bad', 'You are losing money on ads.'] : v < 100 ? ['ok', 'Positive, but check your product costs.'] : ['good', 'You more than doubled your ad money.']),
  },
  {
    key: 'convRate', name: 'Sales rate', unit: '%', needs: 'clicks and conversions',
    meaning: 'Out of every 100 clicks, how many became a sale or sign-up.',
    hint: (v) => (v < 1 ? ['bad', 'Low. Look at your landing page or offer.'] : v < 3 ? ['ok', 'Around average.'] : ['good', 'Strong.']),
  },
];

const TONE = { good: 'bg-ok-soft text-ok', ok: 'bg-sand text-ink', bad: 'bg-bad-soft text-bad' };
const TONE_LABEL = { good: 'Looks good', ok: 'About average', bad: 'Looks weak' };

export default function AdCostCalculator() {
  const [form, setForm] = useState({ spend: '500', impressions: '50000', clicks: '600', conversions: '25', revenue: '1500' });
  const idBase = useId();

  const values = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parse(v)]));
  const invalid = Object.entries(values).filter(([, v]) => Number.isNaN(v)).map(([k]) => k);
  const nums = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === null || Number.isNaN(v) ? 0 : v]));
  const m = computeMetrics(nums);
  const anything = Object.values(values).some((v) => v !== null);
  const clicksOverViews = nums.clicks > nums.impressions && nums.impressions > 0;

  const fields = [
    { key: 'spend', label: 'Money spent on ads' },
    { key: 'impressions', label: 'Impressions (times shown)' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'conversions', label: 'Sales or sign-ups' },
    { key: 'revenue', label: 'Money earned from those sales' },
  ];
  const inputStyle = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

  return (
    <ToolFrame
      path="/tools/fb-ad-cost"
      name="Ad Cost Calculator"
      title="Work out what your ads really cost"
      intro="Type what you spent and any results you have. You will get cost per click, cost per sale, return on spend and more, each with a plain-English meaning."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Your numbers</h2>
          <p className="text-sm text-muted">Fill in what you know. Leave the rest empty. Use the same currency everywhere.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label htmlFor={`${idBase}${f.key}`} className="text-sm font-semibold text-ink">{f.label}</label>
                <input
                  id={`${idBase}${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  className={inputStyle}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {invalid.length > 0 && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">Please use numbers that are zero or more. Check: {invalid.join(', ')}.</p>}
          {clicksOverViews && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">You have more clicks than impressions, which is not possible. Check those two boxes.</p>}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Your results</h2>
          {!anything ? (
            <p className="text-sm text-muted">Enter your spend and a result to begin.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {METRICS.map((metric) => {
                const v = m[metric.key];
                const [tone, text] = v === null ? [null, ''] : metric.hint(v);
                const shown = v === null ? null : metric.unit === '%' ? `${fmt(v)}%` : metric.unit === 'x' ? `${fmt(v)}x` : fmt(v);
                return (
                  <div key={metric.key} className="space-y-2 rounded-lg border border-line bg-paper p-4">
                    <p className="text-sm font-semibold text-ink">{metric.name}</p>
                    <p className="text-2xl font-bold text-wine">{shown ?? '–'}</p>
                    <p className="text-sm text-muted">{metric.meaning}</p>
                    {v === null ? (
                      <p className="text-xs text-muted">Needs {metric.needs} (above zero).</p>
                    ) : (
                      <p className={`rounded-md px-3 py-2 text-xs ${TONE[tone]}`}><span className="font-semibold">{TONE_LABEL[tone]}.</span> {text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted">The good and bad hints are rough guides for typical Facebook and Instagram ads. Your industry and country can be very different.</p>
        </Card>
      </div>
    </ToolFrame>
  );
}
