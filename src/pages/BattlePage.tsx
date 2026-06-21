import BattleCanvas from '../components/BattleCanvas';
import ControlPanel from '../components/ControlPanel';
import StatsPanel from '../components/StatsPanel';
import ShipTooltip from '../components/ShipTooltip';
import SimControls from '../components/SimControls';

export default function BattlePage() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1a2a3a]/60 bg-[#0a0e1a]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
          <h1
            className="text-[#00ff88] text-lg font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Fleet Battle Simulator
          </h1>
        </div>
        <div className="text-gray-500 text-xs tracking-wider" style={{ fontFamily: 'Source Code Pro, monospace' }}>
          ECS v1.0 // REAL-TIME
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative">
          <BattleCanvas />
          <ShipTooltip />
        </div>

        <aside className="w-64 border-l border-[#1a2a3a]/60 bg-[#0d1220] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-[#1a2a3a]/40">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              舰队操控
            </div>
            <ControlPanel />
          </div>
          <div className="p-3 flex-1">
            <StatsPanel />
          </div>
        </aside>
      </div>

      <footer className="px-4 py-2 border-t border-[#1a2a3a]/60">
        <SimControls />
      </footer>
    </div>
  );
}
