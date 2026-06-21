import { useBattleStore } from '../store/battleStore';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

const speedOptions = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export default function SimControls() {
  const simState = useBattleStore((s) => s.simState);
  const speed = useBattleStore((s) => s.speed);
  const startBattle = useBattleStore((s) => s.startBattle);
  const pauseBattle = useBattleStore((s) => s.pauseBattle);
  const resumeBattle = useBattleStore((s) => s.resumeBattle);
  const resetBattle = useBattleStore((s) => s.resetBattle);
  const setSpeed = useBattleStore((s) => s.setSpeed);

  return (
    <div className="flex items-center justify-between bg-[#0a0e1a] border border-[#1a2a3a] rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        {simState === 'idle' && (
          <button
            onClick={startBattle}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] rounded font-medium text-sm transition-colors"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Play size={16} />
            开战
          </button>
        )}
        {simState === 'running' && (
          <button
            onClick={pauseBattle}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ffaa00]/20 hover:bg-[#ffaa00]/30 text-[#ffaa00] rounded font-medium text-sm transition-colors"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Pause size={16} />
            暂停
          </button>
        )}
        {simState === 'paused' && (
          <button
            onClick={resumeBattle}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] rounded font-medium text-sm transition-colors"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Play size={16} />
            继续
          </button>
        )}
        {simState === 'finished' && (
          <button
            onClick={resetBattle}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] rounded font-medium text-sm transition-colors"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <RotateCcw size={16} />
            重来
          </button>
        )}

        {simState !== 'idle' && simState !== 'finished' && (
          <button
            onClick={resetBattle}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/20 hover:bg-gray-700/30 text-gray-400 rounded text-sm transition-colors"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <FastForward size={12} className="text-gray-500" />
        {speedOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSpeed(opt.value)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              speed === opt.value
                ? 'bg-[#00ff88]/20 text-[#00ff88]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={{ fontFamily: 'Source Code Pro, monospace' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
