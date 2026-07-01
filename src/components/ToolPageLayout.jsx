import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FileDropZone from './FileDropZone';
import ProcessingQueue from './ProcessingQueue';
import SeoMeta from './SeoMeta';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ToolPageLayout(props) {
  // Support both grouped 'processor' prop (clean decoupled architecture) and spread props (backward compatibility)
  const processor = props.processor || props;
  const {
    queue,
    isProcessing,
    overallProgress,
    addFiles,
    removeFile,
    clearQueue,
    processQueue
  } = processor;

  const {
    title,
    description,
    icon = 'fa-screwdriver-wrench',
    categoryName = 'Tools',
    categoryPath = '/all-tools',
    acceptTypes,
    optionsTitle = 'Conversion Settings',
    optionsContent,
    processFileFn,
    faqs = []
  } = props;
  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10"
    >
      <SeoMeta title={title} description={description} />
      {/* Breadcrumbs */}
      <motion.div variants={itemVariants} className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to={categoryPath} className="hover:text-white transition-colors">{categoryName}</Link></li>
          <li className="text-sky-600 font-medium">{title}</li>
        </ul>
      </motion.div>

      {/* Hero Title Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
              <i className={`fa-solid ${icon} text-lg`}></i>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">{title}</h1>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Local Security Shield */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 max-w-xs md:self-center">
          <i className="fa-solid fa-shield-halved text-emerald-600 text-2xl"></i>
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-outfit">Local Processing</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Files are converted in browser cache via WebAssembly. Zero uploads. Secure & private.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progressive Disclosure Content Area */}
      {queue.length === 0 ? (
        <motion.div variants={itemVariants} className="max-w-3xl mx-auto mt-8">
          <FileDropZone onFilesAdded={addFiles} acceptTypes={acceptTypes} icon={icon} />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Processing Queue */}
          <div className="lg:col-span-2 space-y-6">
            <ProcessingQueue
              queue={queue}
              isProcessing={isProcessing}
              overallProgress={overallProgress}
              onRemove={removeFile}
              onClear={clearQueue}
              onProcess={(forceAll) => processQueue(processFileFn, forceAll)}
            />
          </div>

          {/* Right column: Options / Settings & FAQ */}
          <div className="space-y-6">
            {/* Options / Settings Card */}
            {optionsContent && (
              <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 font-outfit">
                  {optionsTitle}
                </h3>
                <div className="space-y-4">{optionsContent}</div>
              </div>
            )}

            {/* Privacy Note */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit flex items-center gap-2">
                <i className="fa-solid fa-lock text-sky-600"></i>
                Why is this free?
              </h4>
              <p className="text-xs text-slate-400 leading-normal">
                By using WebAssembly, the processing happens directly on your own device. Because we do not upload files to external servers, we save 100% on expensive server hosting bills and can offer this platform for free.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQ Accordion Section */}
      {faqs && faqs.length > 0 && (
        <motion.div variants={itemVariants} className="border-t border-white/10 pt-12 space-y-6">
          <h2 className="text-xl font-bold text-white font-outfit">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card rounded-xl p-5 border border-white/10 space-y-2">
                <h4 className="font-semibold text-white text-sm flex gap-2 items-start font-outfit">
                  <i className="fa-regular fa-circle-question text-sky-600 mt-0.5"></i>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
