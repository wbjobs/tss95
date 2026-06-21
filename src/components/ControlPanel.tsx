import { useBattleStore } from '../store/battleStore';
import type { TacticMode } from '../ecs/components/AIComponent';
import type { Team } from '../ecs/components/TeamComponent';
import { Plus, Minus, Crosshair, Waves } from 'lucide-react';

const tacticOptions: { value: TacticMode; label: string; icon: React.ReactNode }[] = [
  { value: 'default', label: '自由交战', icon: <Crosshair size={14} /> },
  { value: 'focus_fire', label: '集中火力', icon: <Crosshair size={14} /> },
  { value: 'guerrilla', label: '分散游击', icon: <Waves size={14} /> },
];

function TeamPanel({ team }: { team: Team }) {
  const simState = useBattleStore((s) => s.simState);
  const count = useBattleStore((s) => (team === 'red' ? s.redCount : s.blueCount));
  const tactic = useBattleStore((s) => (team === 'red' ? s.redTactic : s.blueTactic));
  const setCount = useBattleStore((s) => (team === 'red' ? s.setRedCount : s.setBlueCount));
  const setTactic = useBattleStore((s) => (team === 'red' ? s.setRedTactic : s.setBlueTactic));
  const addShips = useBattleStore((s) => s.addShips);
  const removeShips = useBattleStore((s) => s.removeShips);

  const isRed = team === 'red';
  const borderColor = isRed ? 'border-[#ff3366]/40' : 'border-[#4488ff]/40';
  const titleColor = isRed ? 'text-[#ff3366]' : 'text-[#4488ff]';
  const bgGlow = isRed ? 'bg-[#ff3366]/5' : 'bg-[#4488ff]/5';
  const btnBg = isRed ? 'bg-[#ff3366]/20 hover:bg-[#ff3366]/30 text-[#ff3366]' : 'bg-[#4488ff]/20 hover:bg-[#4488ff]/30 text-[#4488ff]';
  const activeBtnBg = isRed ? 'bg-[#ff3366] text-white' : 'bg-[#4488ff] text-white';

  return (
    <div className={`${bgGlow} border ${borderColor} rounded-lg p-3 space-y-3`}>
      <div className={`text-sm font-bold tracking-wider ${titleColor}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        {isRed ? 'RED FLEET' : 'BLUE FLEET'}
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">舰船数量</div>
        <div className="flex items-center gap-2">
          {simState === 'idle' ? (
            <>
              <button
                onClick={() => setCount(count - 1)}
                className={`w-7 h-7 flex items-center justify-center rounded ${btnBg} transition-colors`}
                disabled={count <= 1}
              >
                <Minus size={12} />
              </button>
              <span className="text-white font-bold text-lg w-8 text-center" style={{ fontFamily: 'Source Code Pro, monospace' }}>
                {count}
              </span>
              <button
                onClick={() => setCount(count + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded ${btnBg} transition-colors`}
                disabled={count >= 20}
              >
                <Plus size={12} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'Source Code Pro, monospace' }}>{count}</span>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => addShips(team, 1)}
                  className={`w-6 h-6 flex items-center justify-center rounded ${btnBg} transition-colors`}
                  title="增援1艘"
                >
                  <Plus size={10} />
                </button>
                <button
                  onClick={() => removeShips(team, 1)}
                  className={`w-6 h-6 flex items-center justify-center rounded ${btnBg} transition-colors`}
                  title="撤退1艘"
                >
                  <Minus size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">战术模式</div>
        <div className="flex gap-1">
          {tacticOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTactic(opt.value)}
              className={`flex-1 px-1.5 py-1.5 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                tactic === opt.value ? activeBtnBg : btnBg
              }`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ControlPanel() {
  return (
    <div className="space-y-3">
      <TeamPanel team="red" />
      <TeamPanel team="blue" />
    </div>
  );
}
