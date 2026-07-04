import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  'Tool Categories': [
    { label: 'Audio Tools', path: '/all-tools?cat=audio', icon: 'fa-music', color: 'text-sky-400' },
    { label: 'Video Tools', path: '/all-tools?cat=video', icon: 'fa-video', color: 'text-violet-400' },
    { label: 'GIF & Image', path: '/all-tools?cat=gif-image', icon: 'fa-image', color: 'text-pink-400' },
    { label: 'AI Generators', path: '/all-tools?cat=ai-generators', icon: 'fa-wand-magic-sparkles', color: 'text-purple-400' },
    { label: 'Marketing', path: '/all-tools?cat=marketing', icon: 'fa-chart-line', color: 'text-amber-400' },
    { label: 'Utilities', path: '/all-tools?cat=utilities', icon: 'fa-screwdriver-wrench', color: 'text-slate-400' },
  ],
  'Platform': [
    { label: 'All 70 Tools', path: '/all-tools', icon: 'fa-grid-2', color: 'text-sky-400' },
    { label: 'Home', path: '/', icon: 'fa-house', color: 'text-slate-400' },
    { label: 'Privacy Policy', path: '/privacy', icon: 'fa-shield-halved', color: 'text-emerald-400' },
    { label: 'Terms of Service', path: '/terms', icon: 'fa-file-lines', color: 'text-slate-400' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="relative border-t pt-16 pb-8"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#040b19' }}
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(14,165,233,0.3), rgba(139,92,246,0.3), transparent)' }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand */}
          <div className="md:col-span-5 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/10 shadow-lg shadow-sky-500/10 group-hover:shadow-sky-500/20 group-hover:border-sky-500/20 transition-all duration-300 overflow-hidden p-1.5">
                <img src="/favicon.png" alt="AudioBulk Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-sora font-bold text-xl text-white">
                Audio<span className="text-gradient">Bulk</span>
              </span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              70 browser-local tools for audio, video, GIF, AI writing, marketing and utilities. No uploads. No servers. No paywalls.
            </p>

            {/* Privacy pledge */}
            <div
              className="rounded-xl p-4 flex items-start gap-3 max-w-sm"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <i className="fa-solid fa-shield-halved text-emerald-400 mt-0.5 text-sm flex-shrink-0"></i>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-emerald-400">Privacy Pledge:</span> Your files never leave your device. All processing runs 100% locally in your browser via WebAssembly.
              </p>
            </div>

            {/* Social icons */}
            <div className="flex gap-3">
              {[
                { icon: 'fa-github', href: 'https://github.com/kush23baghel/AudioBulk.Com', label: 'GitHub' },
                { icon: 'fa-x-twitter', href: 'https://twitter.com', label: 'Twitter' },
                { icon: 'fa-youtube', href: 'https://youtube.com', label: 'YouTube' },
              ].map(({ icon, href, label }) => (
                <a
                  key={icon}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border text-slate-500 hover:text-white hover:border-white/20 transition-all duration-200"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                >
                  <i className={`fa-brands ${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="md:col-span-3">
              <h3 className="font-manrope text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors duration-200 group"
                    >
                      <i className={`fa-solid ${link.icon} text-xs ${link.color} opacity-70 group-hover:opacity-100 transition-opacity`}></i>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Spacer */}
          <div className="md:col-span-1" />
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-slate-600">
            © {year} AudioBulk — All processing is 100% client-side.
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-emerald-500/50 text-[10px]"></i>
            No uploads. No tracking. No paywalls.
          </p>
        </div>
      </div>
    </footer>
  );
}
