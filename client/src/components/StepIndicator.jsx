import { motion } from 'framer-motion';

export default function StepIndicator({ steps, current }) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div className="step-indicator-item" key={label}>
            <motion.div
              className={`step-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isDone ? '✓' : i + 1}
            </motion.div>
            <span className={`step-label ${isActive ? 'active' : ''}`}>{label}</span>
            {i < steps.length - 1 && (
              <div className="step-connector">
                <motion.div
                  className="step-connector-fill"
                  animate={{ width: isDone ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
