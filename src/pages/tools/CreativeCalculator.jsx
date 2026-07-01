import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CreativeCalculator() {
  const [numDesigners, setNumDesigners] = useState(2);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [hoursPerGraphic, setHoursPerGraphic] = useState(2.5);
  const [hourlyRate, setHourlyRate] = useState(35);

  const totalCapacityHours = numDesigners * hoursPerWeek;
  const totalGraphicsPerWeek = hoursPerGraphic > 0 ? Math.floor(totalCapacityHours / hoursPerGraphic) : 0;
  const totalCostPerWeek = totalCapacityHours * hourlyRate;
  const costPerGraphic = totalGraphicsPerWeek > 0 ? (totalCostPerWeek / totalGraphicsPerWeek).toFixed(2) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Creative Calculator</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-calculator text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Creative Capacity Calculator</h1>
          <p className="text-slate-400 text-sm">Estimate team output, bandwidth, and cost per ad creative.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-2">Team Variables</h2>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Number of Designers</span>
            </label>
            <input 
              type="number" 
              min="0"
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              value={numDesigners}
              onChange={(e) => setNumDesigners(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Hours per Designer (Per Week)</span>
            </label>
            <input 
              type="number" 
              min="0"
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Average Time per Graphic (Hours)</span>
            </label>
            <input 
              type="number" 
              min="0.1"
              step="0.1"
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              value={hoursPerGraphic}
              onChange={(e) => setHoursPerGraphic(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Average Hourly Rate ($)</span>
            </label>
            <input 
              type="number" 
              min="0"
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-white mb-6">Capacity & Output</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-[#0b1426]/60 rounded-xl shadow-glass-inset border-white/5 p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Capacity</p>
                  <p className="font-semibold text-white">{totalCapacityHours} hours/week</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0b1426]/60 rounded-xl shadow-glass-inset border-white/5 p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <i className="fa-solid fa-images"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Output</p>
                  <p className="font-semibold text-white">{totalGraphicsPerWeek} graphics/week</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0b1426]/60 rounded-xl shadow-glass-inset border-white/5 p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <i className="fa-solid fa-sack-dollar"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Estimated Cost per Graphic</p>
                  <p className="font-semibold text-white">${costPerGraphic}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0b1426]/60 rounded-xl shadow-glass-inset border-white/5 p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <i className="fa-solid fa-money-bill-trend-up"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Weekly Cost</p>
                  <p className="font-semibold text-white">${totalCostPerWeek}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
