import { motion } from 'framer-motion';

const ScanningCard = () => {
    return (
        <div className="relative w-full max-w-[300px] mx-auto bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm transition-colors duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-mono">CMPDI_PROP_2024.pdf</div>
            </div>
            <div className="p-6 space-y-4 relative mt-4">
                <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-10"
                />
                <div className="space-y-3 opacity-50 blur-[0.5px]">
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4 relative z-20">
                    {['Budget: ₹45L', 'Novelty: 92%', 'Guideline: S&T'].map((tag, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 1.2, duration: 0.4 }}
                            className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded"
                        >
                            {tag}
                        </motion.span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ScanningCard;