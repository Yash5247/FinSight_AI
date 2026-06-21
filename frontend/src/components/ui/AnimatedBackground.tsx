import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      <motion.div
        className="animated-bg-orb animated-bg-orb--1"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="animated-bg-orb animated-bg-orb--2"
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="animated-bg-orb animated-bg-orb--3"
        animate={{
          x: [0, 40, -60, 0],
          y: [0, 70, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="animated-bg-grid" />
    </div>
  );
}
