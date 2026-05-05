import { motion } from 'framer-motion';

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const containerSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3">
      {/* Circular Icon */}
      <div className={`relative ${containerSizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Definitions for gradients and glows */}
          <defs>
            <radialGradient id="cyanglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="greenglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="1" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="purpleglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4a0080" stopOpacity="1" />
              <stop offset="100%" stopColor="#4a0080" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer dashed orbit - counter clockwise */}
          <motion.circle
            cx="60" cy="60" r="52" fill="none"
            stroke="url(#cyanglow)" strokeWidth="1.5"
            strokeDasharray="8 6"
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '60px 60px' }}
          />

          {/* Middle dashed orbit - clockwise */}
          <motion.circle
            cx="60" cy="60" r="38" fill="none"
            stroke="url(#greenglow)" strokeWidth="1.5"
            strokeDasharray="6 8"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '60px 60px' }}
          />

          {/* Inner dashed orbit - counter clockwise */}
          <motion.circle
            cx="60" cy="60" r="24" fill="none"
            stroke="url(#purpleglow)" strokeWidth="1.5"
            strokeDasharray="4 10"
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '60px 60px' }}
          />

          {/* Three glowing dots on a triangle */}
          {/* Top dot - Cyan */}
          <motion.circle
            cx="60" cy="22" r="10"
            fill="#00d4ff"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="60" cy="22" r="14" fill="url(#cyanglow)" opacity="0.4" />

          {/* Bottom right dot - Green */}
          <motion.circle
            cx="92" cy="78" r="10"
            fill="#00ff88"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <circle cx="92" cy="78" r="14" fill="url(#greenglow)" opacity="0.4" />

          {/* Bottom left dot - Purple */}
          <motion.circle
            cx="28" cy="78" r="10"
            fill="#6a00a0"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <circle cx="28" cy="78" r="14" fill="url(#purpleglow)" opacity="0.4" />

          {/* Connection lines between dots */}
          <line x1="60" y1="22" x2="92" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="92" y1="78" x2="28" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="28" y1="78" x2="60" y2="22" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Center ring */}
          <circle cx="60" cy="60" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Center text */}
          <text
            x="60" y="66"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            style={{ letterSpacing: '1px' }}
          >
            AS
          </text>
        </svg>
      </div>

      {/* Text Logo */}
      <div className={`font-bold ${textSizeClasses[size]} tracking-tight leading-none`}>
        <span className="text-white">As</span>
        <span className="bg-gradient-to-r from-primary via-accent to-green bg-clip-text text-transparent">pace</span>
      </div>
    </div>
  );
};

export default Logo;
