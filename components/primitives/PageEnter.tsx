'use client';

import { motion } from 'motion/react';
import type { Transition } from 'motion/react';

const ease: Transition = {
  duration: 0.36,
  ease: [0.16, 1, 0.3, 1],
};

type PageEnterProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function PageEnter({ children, className, delay = 0 }: PageEnterProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ease, delay }}
    >
      {children}
    </motion.div>
  );
}
