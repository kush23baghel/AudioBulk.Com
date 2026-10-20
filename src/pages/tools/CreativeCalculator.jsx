import { useState, useId } from 'react';
import ToolFrame from '../../ui/ToolFrame';
import { Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'How accurate is this?',
    a: 'It is only as accurate as the hours you type in. Time how long a real ad takes your team, including feedback and fixes, and use that number. Most teams guess too low.',
  },
  {
    q: 'What does "share of time" mean?',
    a: 'It is how you split your team\'s week between the types of ad. If you type 50 for pictures and 50 for videos, half the hours go to each. The shares do not have to add up to 100, because the tool scales them for you.',
  },
  {
    q: 'Why 4.33 weeks in a month?',
    a: 'A year has 52 weeks and 12 months, so one month is about 4.33 weeks.',
  },
  {
    q: 'Does the cost include software, meetings or tax?',
    a: 'No. Cost per ad is just hours multiplied by cost per hour. Put your full cost per hour (pay plus extras) in the box if you want it included.',
  },
];

const WEEKS_PER_MONTH = 52 / 12;

const TYPES = [
  { key: 'image', label: 'Single image ad', hours: 1.5, share: 40 },
  { key: 'carousel', label: 'Carousel (several images)', hours: 3, share: 20 },
  { key: 'video', label: 'Short video ad', hours: 5, share: 30 },
  { key: 'story', label: 'Story or Reel', hours: 4, share: 10 },
];

// Pure maths, so it can be checked on its own.
function calculate({ designers, hoursPerWeek, rate, types }) {
  const capacity = designers * hoursPerWeek;
  const totalShare = types.reduce((sum, t) => sum + t.share, 0);
  const rows = types.map((t) => {
    const hours = capacity * (totalShare > 0 ? t.share / totalShare : 0);
    const perWeek = t.hours > 0 ? hours / t.hours : 0;
    return { ...t, perWeek, perMonth: perWeek * WEEKS_PER_MONTH, costPerAd: t.hours * rate };
  });
  const adsPerWeek = rows.reduce((sum, r) => sum + r.perWeek, 0);
  const weeklyCost = capacity * rate;
  return { capacity, rows, adsPerWeek, adsPerMonth: adsPerWeek * WEEKS_PER_MONTH, weeklyCost, avgCost: adsPerWeek > 0 ? weeklyCost / adsPerWeek : 0 };
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const fmt = (n, d = 1) => (Number.isInteger(n) ? String(n) : n.toFixed(d));
const money = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreativeCalculator() {
  const [designers, setDesigners] = useState('3');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [rate, setRate] = useState('30');
  const [types, setTypes] = useState(TYPES.map((t) => ({ ...t, hours: String(t.hours), share: String(t.share) })));
  const idBase = useId();

  const setType = (key, field, value) => setTypes(types.map((t) => (t.key === key ? { ...t, [field]: value } : t)));

  const parsed = types.map((t) => ({ ...t, hours: num(t.hours), share: num(t.share) }));
  const r = calculate({ designers: num(designers), hoursPerWeek: num(hoursPerWeek), rate: num(rate), types: parsed });
  const shareSum = parsed.reduce((s, t) => s + t.share, 0);
  const missing = [];
  if (num(designers) === 0) missing.push('how many designers you have');
  if (num(hoursPerWeek) === 0) missing.push('hours each designer works on ads per week');
  if (shareSum === 0) missing.push('a share of time for at least one ad type');

  const inputStyle = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';
  const field = (id, label, value, set, hint) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      <input id={id} type="number" inputMode="decimal" min="0" step="any" className={inputStyle} value={value} onChange={(e) => set(e.target.value)} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );

  return (
    <ToolFrame
      path="/tools/creative-calculator"
      name="Design Team Calculator"
      title="Work out how many ads your design team can make"
      intro="Tell us about your team and how long each kind of ad takes. You will see how many ads you get each week and month, and what each one costs."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Your team</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {field(`${idBase}d`, 'Designers', designers, setDesigners)}
            {field(`${idBase}h`, 'Hours per week, each', hoursPerWeek, setHoursPerWeek, 'Hours spent on ads, not meetings.')}
            {field(`${idBase}r`, 'Cost per hour', rate, setRate, 'In your own currency.')}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Your ad types</h2>
          <div className="space-y-4">
            {types.map((t) => (
              <div key={t.key} className="grid gap-3 rounded-lg bg-paper p-3 sm:grid-cols-[1fr_8rem_8rem] sm:items-end">
                <p className="font-semibold text-ink">{t.label}</p>
                {field(`${idBase}${t.key}h`, 'Hours per ad', t.hours, (v) => setType(t.key, 'hours', v))}
                {field(`${idBase}${t.key}s`, 'Share of time %', t.share, (v) => setType(t.key, 'share', v))}
              </div>
            ))}
          </div>
          {shareSum > 0 && Math.round(shareSum) !== 100 && (
            <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">Your shares add up to {fmt(shareSum)}, not 100. That is fine. They are scaled to fit.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>What you get</h2>
          {missing.length > 0 ? (
            <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">Please enter {missing.join(', and ')}.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3" role="status">
                <div className="rounded-lg bg-wine-soft p-4"><p className="text-sm text-muted">Ads per week</p><p className="text-2xl font-bold text-wine">{fmt(r.adsPerWeek)}</p></div>
                <div className="rounded-lg bg-wine-soft p-4"><p className="text-sm text-muted">Ads per month</p><p className="text-2xl font-bold text-wine">{fmt(r.adsPerMonth)}</p></div>
                <div className="rounded-lg bg-wine-soft p-4"><p className="text-sm text-muted">Average cost per ad</p><p className="text-2xl font-bold text-wine">{money(r.avgCost)}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="text-muted">
                    <tr><th className="py-2 pr-3 font-semibold">Ad type</th><th className="py-2 pr-3 font-semibold">Per week</th><th className="py-2 pr-3 font-semibold">Per month</th><th className="py-2 font-semibold">Cost per ad</th></tr>
                  </thead>
                  <tbody>
                    {r.rows.map((row) => (
                      <tr key={row.key} className="border-t border-line">
                        <td className="py-2 pr-3">{row.label}</td>
                        <td className="py-2 pr-3">{fmt(row.perWeek)}</td>
                        <td className="py-2 pr-3">{fmt(row.perMonth)}</td>
                        <td className="py-2">{money(row.costPerAd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1 rounded-lg bg-paper p-4 text-sm text-ink">
                <p className="font-semibold">How this is worked out</p>
                <p>Team hours per week = designers ({fmt(num(designers))}) x hours each ({fmt(num(hoursPerWeek))}) = {fmt(r.capacity)} hours.</p>
                <p>Each ad type gets its share of those hours. Ads made = hours given to that type / hours one ad takes.</p>
                <p>Cost per ad = hours one ad takes x cost per hour ({money(num(rate))}). The team costs {money(r.weeklyCost)} per week.</p>
                <p>Per month = per week x {fmt(WEEKS_PER_MONTH, 2)}.</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
