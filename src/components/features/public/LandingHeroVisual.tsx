'use client';

import { motion } from 'framer-motion';

export default function LandingHeroVisual() {
  return (
    <div className="relative h-[480px] md:h-[540px] w-full flex items-center justify-center select-none">
      
      {/* Decorative backdrop aura */}
      <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#EFE8DC] blur-3xl opacity-60 pointer-events-none" />

      {/* Card 1 (Left - tilted) */}
      <motion.div 
        initial={{ opacity: 0, rotate: -20, x: -60, y: 30 }}
        animate={{ opacity: 1, rotate: -12, x: -70, y: 15 }}
        whileHover={{ rotate: -6, scale: 1.03, zIndex: 35 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-10 w-60 md:w-72 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3.5 border border-[#E8E8E3] cursor-pointer transition-shadow"
      >
        <div className="aspect-[3/4] bg-[#5B798A] overflow-hidden rounded-xl mb-3 relative">
          <img 
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80" 
            alt="Cerulean Solitude" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] uppercase tracking-widest text-[#FAF5EC] font-semibold">
            Oil on Canvas
          </div>
        </div>
        <div className="px-1">
          <p className="text-xs font-serif font-bold text-[#141413] truncate">Cerulean Solitude</p>
          <p className="text-[10px] text-[#6E6E69] uppercase tracking-wider font-semibold mt-0.5">Julian Moreau • 2024</p>
        </div>
      </motion.div>

      {/* Card 2 (Right - tilted) */}
      <motion.div 
        initial={{ opacity: 0, rotate: 20, x: 60, y: 30 }}
        animate={{ opacity: 1, rotate: 12, x: 70, y: 15 }}
        whileHover={{ rotate: 6, scale: 1.03, zIndex: 35 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-20 w-60 md:w-72 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3.5 border border-[#E8E8E3] cursor-pointer transition-shadow"
      >
        <div className="aspect-[3/4] bg-[#C4775A] overflow-hidden rounded-xl mb-3 relative">
          <img 
            src="https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=700&q=80" 
            alt="Terra Incognita" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] uppercase tracking-widest text-[#FAF5EC] font-semibold">
            Mixed Media
          </div>
        </div>
        <div className="px-1">
          <p className="text-xs font-serif font-bold text-[#141413] truncate">Terra Incognita</p>
          <p className="text-[10px] text-[#6E6E69] uppercase tracking-wider font-semibold mt-0.5">Clara Vance • 2024</p>
        </div>
      </motion.div>

      {/* Card 3 (Center - Elevated Foreground) */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: -10 }}
        whileHover={{ scale: 1.03, zIndex: 40 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-30 w-64 md:w-80 bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.12)] p-4 border border-[#E8E8E3] cursor-pointer"
      >
        <div className="aspect-[3/4] bg-[#D7AC9C] overflow-hidden rounded-xl mb-3.5 relative">
          <img 
            src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80" 
            alt="Monsoon No. 4" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3.5 right-3.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] uppercase tracking-widest text-[#141413] font-bold shadow-sm">
            Curator Pick
          </div>
        </div>
        <div className="px-1 flex items-baseline justify-between">
          <div>
            <p className="text-sm font-serif font-bold text-[#141413]">Monsoon No. 4</p>
            <p className="text-[10px] text-[#6E6E69] uppercase tracking-wider font-semibold mt-0.5">Aria Chen • 2024</p>
          </div>
          <span className="text-xs font-bold text-[#141413]">₹1,45,000</span>
        </div>
      </motion.div>

      {/* Museum Seal / Rotating Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="absolute z-40 -bottom-6 left-6 md:left-12 w-28 h-28 bg-[#FAF5EC] rounded-full flex items-center justify-center shadow-xl border border-[#E8E8E3]"
      >
        <div className="text-center p-3">
          <p className="text-[#141413] text-[13px] font-serif italic leading-tight">Art is a</p>
          <p className="text-[#141413] text-[13px] font-serif italic leading-tight">way of</p>
          <p className="text-[#141413] text-[13px] font-serif italic leading-tight">seeing.</p>
          <p className="text-[7px] tracking-[0.2em] text-[#865E16] font-bold mt-1.5 uppercase">Eras Studio</p>
        </div>
      </motion.div>

    </div>
  );
}
