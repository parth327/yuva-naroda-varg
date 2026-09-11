import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function AnimatedCounter({ value }) {
  const spanRef = useRef(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 90, damping: 20 });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (spanRef.current) spanRef.current.textContent = Math.round(v).toLocaleString();
    });
  }, [spring]);

  return <motion.span ref={spanRef}>0</motion.span>;
}
