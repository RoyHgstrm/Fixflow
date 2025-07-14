'use client';

import { motion } from 'framer-motion';

export function AnimatedHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-5xl font-extrabold tracking-tight text-center lg:text-start sm:text-[4rem]"
    >
      {children}
    </motion.h1>
  );
}
