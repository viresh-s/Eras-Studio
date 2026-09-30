'use client';

import { motion } from 'framer-motion';

const avatars = [
  { id: 1, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', top: '-10%', left: '10%', size: 'w-16 h-16', delay: 0 },
  { id: 2, src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', top: '15%', left: '-5%', size: 'w-20 h-20', delay: 1.2 },
  { id: 3, src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', top: '60%', left: '5%', size: 'w-14 h-14', delay: 0.5 },
  { id: 4, src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', top: '-5%', right: '15%', size: 'w-14 h-14', delay: 0.8 },
  { id: 5, src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', top: '25%', right: '-5%', size: 'w-24 h-24', delay: 2.1 },
  { id: 6, src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80', top: '70%', right: '10%', size: 'w-16 h-16', delay: 1.5 },
];

export default function AvatarCloud() {
  return (
    <div className="relative py-32 overflow-hidden flex items-center justify-center">
      <div className="text-center z-10 max-w-2xl px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6"
        >
          You will find yourself <span className="text-accent-coral italic">among us</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-500"
        >
          Join a thriving community of independent creators and passionate collectors shaping the future of art.
        </motion.p>
      </div>

      <div className="absolute inset-0 pointer-events-none max-w-6xl mx-auto w-full h-full">
        {avatars.map((avatar) => (
          <motion.div
            key={avatar.id}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: avatar.delay * 0.3 }} // Entrance animation
            className={`absolute ${avatar.size}`}
            style={{ top: avatar.top, left: avatar.left, right: avatar.right }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: avatar.delay // Stagger the floating loop
              }}
              className="w-full h-full rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white"
            >
              <img src={avatar.src} alt="" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
