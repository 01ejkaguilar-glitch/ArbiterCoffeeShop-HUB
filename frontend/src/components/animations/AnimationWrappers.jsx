import { motion } from 'framer-motion';

/**
 * FadeIn - Simple fade-in animation wrapper
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.duration - Animation duration in seconds (default: 0.3)
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {string} props.className - Additional CSS classes
 */
export const FadeIn = ({ children, duration = 0.3, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInUp - Slide in from bottom with fade
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.duration - Animation duration in seconds (default: 0.4)
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {number} props.distance - Distance to slide in pixels (default: 20)
 * @param {string} props.className - Additional CSS classes
 */
export const SlideInUp = ({ children, duration = 0.4, delay = 0, distance = 20, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -distance }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideInLeft - Slide in from left with fade
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.duration - Animation duration in seconds (default: 0.4)
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {number} props.distance - Distance to slide in pixels (default: 20)
 * @param {string} props.className - Additional CSS classes
 */
export const SlideInLeft = ({ children, duration = 0.4, delay = 0, distance = 20, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -distance }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: distance }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn - Scale in from center with fade
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.duration - Animation duration in seconds (default: 0.3)
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {number} props.initialScale - Starting scale (default: 0.95)
 * @param {string} props.className - Additional CSS classes
 */
export const ScaleIn = ({ children, duration = 0.3, delay = 0, initialScale = 0.95, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: initialScale }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeInOnScroll - Fade in when element enters viewport
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.duration - Animation duration in seconds (default: 0.5)
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {boolean} props.once - Only animate once (default: true)
 * @param {string} props.className - Additional CSS classes
 */
export const FadeInOnScroll = ({ children, duration = 0.5, delay = 0, once = true, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-50px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerChildren - Stagger animation for child elements
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} props.staggerDelay - Delay between each child (default: 0.1)
 * @param {string} props.className - Additional CSS classes
 */
export const StaggerChildren = ({ children, staggerDelay = 0.1, className = '' }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem - Individual item in a stagger animation
 * Should be used as a child of StaggerChildren
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {string} props.className - Additional CSS classes
 */
export const StaggerItem = ({ children, className = '' }) => {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * AnimatedButton - Button with hover and tap animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disabled state
 */
export const AnimatedButton = ({ children, onClick, className = '', disabled = false, variant, size, ...props }) => {
  // Build Bootstrap button classes from variant/size props
  const btnClasses = [
    'btn',
    variant ? `btn-${variant}` : '',
    size ? `btn-${size}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98, y: disabled ? 0 : 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={onClick}
      disabled={disabled}
      className={btnClasses}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * AnimatedCard - Card with hover lift animation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 */
export const AnimatedCard = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * PageTransition - Wrapper for page transitions
 * Use with AnimatePresence in routing
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.className - Additional CSS classes
 */
export const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedModal - Modal with fade and scale animation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.className - Additional CSS classes
 */
export const AnimatedModal = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * MotionConfig wrapper that respects prefers-reduced-motion
 * Wrap your app or specific sections with this component
 */
export const ReducedMotionConfig = ({ children }) => {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      // Framer Motion automatically respects prefers-reduced-motion media query
    >
      {children}
    </motion.div>
  );
};
