import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdCostCalculator() {
  const [spend, setSpend] = useState(1000);
  const [impressions, setImpressions] = useState(100000);
  const [clicks, setClicks] = useState(2000);
  const [conversions, setConversions] = useState(100);
  const [revenue, setRevenue] = useState(3000);

  // Derived metrics
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
  const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : 0;
  const cpm = impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : 0;
  const cpa = conversions > 0 ? (spend / conversions).toFixed(2) : 0;
  const convRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0;
  const netProfit = revenue - spend;
  const roi = spend > 0 ? ((netProfit / spend) * 100).toFixed(2) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Calculators</Link></li>
          <li className="text-sky-600 font-medium">Ad Cost Calculator</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-calculator text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Ad Cost & ROI Calculator</h1>
          <p className="text-slate-400 text-sm">Input your ad performance data to analyze marketing KPIs in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Sliders */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 font-outfit">
            Campaign Variables
          </h3>

          <div className="space-y-4">
            {/* Spend Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Ad Spend</span>
                <span className="font-bold text-sky-600">${spend.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10"
                max="50000"
                step="10"
                value={spend}
                onChange={(e) => setSpend(parseInt(e.target.value))}
                className="range range-sky range-xs bg-white/5 p-1 border border-white/10 rounded-lg"
              />
            </div>

            {/* Impressions Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Impressions</span>
                <span className="font-bold text-sky-600">{impressions.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="2000000"
                step="1000"
                value={impressions}
                onChange={(e) => setImpressions(parseInt(e.target.value))}
                className="range range-sky range-xs bg-white/5 p-1 border border-white/10 rounded-lg"
              />
            </div>

            {/* Clicks Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Clicks</span>
                <span className="font-bold text-sky-600">{clicks.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100000"
                step="5"
                value={clicks}
                onChange={(e) => setClicks(Math.min(impressions, parseInt(e.target.value)))}
                className="range range-sky range-xs bg-white/5 p-1 border border-white/10 rounded-lg"
              />
            </div>

            {/* Conversions Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Conversions / Sales</span>
                <span className="font-bold text-sky-600">{conversions.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20000"
                step="1"
                value={conversions}
                onChange={(e) => setConversions(Math.min(clicks, parseInt(e.target.value)))}
                className="range range-sky range-xs bg-white/5 p-1 border border-white/10 rounded-lg"
              />
            </div>

            {/* Revenue Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Gross Revenue Generated</span>
                <span className="font-bold text-sky-600">${revenue.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="150000"
                step="100"
                value={revenue}
                onChange={(e) => setRevenue(parseInt(e.target.value))}
                className="range range-sky range-xs bg-white/5 p-1 border border-white/10 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Results */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 font-outfit">
              Calculated KPIs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b1426]/80 backdrop-blur-md shadow-inner rounded-xl p-3 border border-white/10 text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-outfit">CTR</span>
                <span className="text-lg font-bold text-slate-300 font-outfit">{ctr}%</span>
              </div>
              <div className="bg-[#0b1426]/80 backdrop-blur-md shadow-inner rounded-xl p-3 border border-white/10 text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-outfit">CPC</span>
                <span className="text-lg font-bold text-slate-300 font-outfit">${cpc}</span>
              </div>
              <div className="bg-[#0b1426]/80 backdrop-blur-md shadow-inner rounded-xl p-3 border border-white/10 text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-outfit">CPM</span>
                <span className="text-lg font-bold text-slate-300 font-outfit">${cpm}</span>
              </div>
              <div className="bg-[#0b1426]/80 backdrop-blur-md shadow-inner rounded-xl p-3 border border-white/10 text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-outfit">CPA</span>
                <span className="text-lg font-bold text-slate-300 font-outfit">${cpa}</span>
              </div>
            </div>

            {/* Profit & ROI Section */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Conversion Rate</span>
                <span className="font-semibold text-slate-200">{convRate}%</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Net Profit</span>
                <span className={`font-semibold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Return on Investment (ROI)</span>
                <span className={`font-bold ${parseFloat(roi) >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                  {roi}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
