import { useState } from 'react';
import axios from 'axios';
import { RotateCw } from 'lucide-react';

const SEGMENTS = [
  { label: '10 Coins',    color: '#3B82F6' },
  { label: '20 Coins',    color: '#8B5CF6' },
  { label: '50 Coins',    color: '#F59E0B' },
  { label: '100 Coins',   color: '#EF4444' },
  { label: '25 XP',       color: '#10B981' },
  { label: '50 XP',       color: '#06B6D4' },
  { label: 'Spin Ticket', color: '#EC4899' },
  { label: 'Nothing 😅',  color: '#6B7280' }
];

const SpinWheel = ({ isOpen, onClose, canSpin, onSpun }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    try {
      setSpinning(true);
      setResult(null);
      const { data } = await axios.post('/gamification/daily-spin');

      // Calculate rotation to land on the winning segment
      const segAngle = 360 / SEGMENTS.length;
      const targetAngle = 360 - (data.segmentIndex * segAngle + segAngle / 2);
      const extraSpins = 5 * 360; // 5 full rotations for dramatic effect
      const newRotation = rotation + extraSpins + targetAngle - (rotation % 360);

      setRotation(newRotation);

      // Wait for animation to finish
      setTimeout(() => {
        setResult(data);
        setSpinning(false);
        if (onSpun) onSpun(data);
      }, 4000);
    } catch (err) {
      console.error('Spin error:', err);
      setSpinning(false);
    }
  };

  if (!isOpen) return null;

  const segAngle = 360 / SEGMENTS.length;
  const radius = 140;
  const center = 160;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold text-white text-center mb-4 flex items-center justify-center gap-2">
          <RotateCw className="text-amber-400" size={24} /> Daily Spin Wheel
        </h2>

        {/* Wheel Container */}
        <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
          {/* Pointer / Arrow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-lg"></div>
          </div>

          {/* Wheel SVG */}
          <svg
            width="320" height="320" viewBox="0 0 320 320"
            className="transition-transform drop-shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? '4s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            }}
          >
            {SEGMENTS.map((seg, i) => {
              const startAngle = (i * segAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
              const x1 = center + radius * Math.cos(startAngle);
              const y1 = center + radius * Math.sin(startAngle);
              const x2 = center + radius * Math.cos(endAngle);
              const y2 = center + radius * Math.sin(endAngle);
              const largeArc = segAngle > 180 ? 1 : 0;

              const labelAngle = ((i * segAngle + segAngle / 2) - 90) * (Math.PI / 180);
              const labelR = radius * 0.65;
              const lx = center + labelR * Math.cos(labelAngle);
              const ly = center + labelR * Math.sin(labelAngle);
              const textRotation = i * segAngle + segAngle / 2;

              return (
                <g key={i}>
                  <path
                    d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={seg.color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={lx} y={ly}
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotation}, ${lx}, ${ly})`}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx={center} cy={center} r="25" fill="#1e293b" stroke="#475569" strokeWidth="3" />
            <text x={center} y={center} fill="white" fontSize="16" textAnchor="middle" dominantBaseline="central">🎰</text>
          </svg>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-emerald-300 font-extrabold text-lg">{result.label}</p>
            <div className="flex items-center justify-center gap-4 mt-1">
              {result.coinsWon > 0 && <span className="text-amber-400 font-bold">+{result.coinsWon} 🪙</span>}
              {result.xpWon > 0 && <span className="text-violet-400 font-bold">+{result.xpWon} XP</span>}
              {result.ticketWon > 0 && <span className="text-pink-400 font-bold">+{result.ticketWon} 🎟️</span>}
              {!result.coinsWon && !result.xpWon && !result.ticketWon && (
                <span className="text-slate-400 font-medium">Better luck next time!</span>
              )}
            </div>
          </div>
        )}

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm tracking-wide"
        >
          {spinning ? '🎰 Spinning...' : !canSpin ? '⏰ Come back tomorrow!' : '🎰 SPIN!'}
        </button>

        <button onClick={onClose} className="w-full mt-2 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

export default SpinWheel;
