import { useBattleStore } from '../store/battleStore';

export default function ShipTooltip() {
  const hoveredShipId = useBattleStore((s) => s.hoveredShipId);
  const simulator = useBattleStore((s) => s.simulator);

  if (!hoveredShipId || !simulator) return null;

  const info = simulator.getShipInfo(hoveredShipId);
  if (!info) return null;

  const isRed = info.team === 'red';
  const color = isRed ? '#ff3366' : '#4488ff';
  const hpPct = (info.hp / info.maxHp) * 100;
  const cdPct = info.maxCooldown > 0 ? ((info.maxCooldown - info.weaponCooldown) / info.maxCooldown) * 100 : 100;
  const hpColor = hpPct > 60 ? '#00ff88' : hpPct > 30 ? '#ffaa00' : '#ff3366';

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: Math.min(info.x + 20, window.innerWidth - 180),
        top: Math.min(info.y - 60, window.innerHeight - 120),
      }}
    >
      <div className="bg-[#0a0e1a]/95 border border-[#1a2a3a] rounded px-3 py-2 shadow-xl backdrop-blur-sm" style={{ minWidth: 150 }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold" style={{ color, fontFamily: 'Rajdhani, sans-serif' }}>
            {isRed ? 'RED' : 'BLUE'} SHIP #{hoveredShipId}
          </span>
        </div>
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>HP</span>
              <span style={{ color: hpColor, fontFamily: 'Source Code Pro, monospace' }}>
                {Math.round(info.hp)}/{info.maxHp}
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full mt-0.5">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>武器冷却</span>
              <span className="text-white" style={{ fontFamily: 'Source Code Pro, monospace' }}>
                {info.weaponCooldown.toFixed(1)}s
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full mt-0.5">
              <div
                className="h-full bg-[#ffaa00] rounded-full transition-all duration-200"
                style={{ width: `${cdPct}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-400">AI状态</span>
            <span className="text-[#00ff88]" style={{ fontFamily: 'Source Code Pro, monospace' }}>
              {info.aiState.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
