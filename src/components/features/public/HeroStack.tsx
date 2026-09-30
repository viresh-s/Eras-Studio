'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const defaultImages = [
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop', // Abstract
  'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=600&auto=format&fit=crop', // Portrait
  'https://images.unsplash.com/photo-1561214115-f2f11415a575?q=80&w=600&auto=format&fit=crop', // Minimal
];

export default function HeroStack() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll progress relative to this component's position
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Calculate transforms for the side cards to fan out horizontally
  const xLeft = useTransform(scrollYProgress, [0.1, 0.4], [0, -220]);
  const rotateLeft = useTransform(scrollYProgress, [0.1, 0.4], [-5, -12]);
  
  const xRight = useTransform(scrollYProgress, [0.1, 0.4], [0, 220]);
  const rotateRight = useTransform(scrollYProgress, [0.1, 0.4], [5, 12]);

  // Make the center card pop up slightly
  const yCenter = useTransform(scrollYProgress, [0.1, 0.4], [0, -30]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/5] md:aspect-square flex items-center justify-center">
      
      {/* Left Card */}
      <motion.div
        style={{ x: xLeft, rotate: rotateLeft, y: 10 }}
        className="absolute w-[240px] md:w-[280px] aspect-[3/4] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden z-10 origin-bottom-right"
      >
        <img src={defaultImages[0]} alt="Artwork 1" className="w-full h-full object-cover" />
      </motion.div>

      {/* Right Card */}
      <motion.div
        style={{ x: xRight, rotate: rotateRight, y: 10 }}
        className="absolute w-[240px] md:w-[280px] aspect-[3/4] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden z-10 origin-bottom-left"
      >
        <img src={defaultImages[2]} alt="Artwork 3" className="w-full h-full object-cover" />
      </motion.div>

      {/* Center Card */}
      <motion.div
        style={{ y: yCenter }}
        className="absolute w-[260px] md:w-[320px] aspect-[3/4] bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] overflow-hidden z-20"
      >
        <img src={defaultImages[1]} alt="Artwork 2" className="w-full h-full object-cover" />
        
        {/* Floating Badge on Center Card */}
        <div className="absolute -bottom-1 -left-1 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 flex items-center gap-2 m-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white text-xs font-bold">
            E
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">@eras_featured</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
