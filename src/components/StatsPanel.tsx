import { type ReactNode } from 'react';
import { useBattleStore } from '../store/battleStore';
import type { TeamStats } from '../simulator/BattleSimulator';
import { Skull, Swords, Heart, TrendingUp } from 'lucide-react';

function StatBar({ label, redValue, blueValue, maxVal, format }: {
  label: ReactNode;
  redValue: number;
  blueValue: number;
  maxVal: number;
  format: (v: number) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
        <span className="flex items-center gap-1">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#ff3366] text-xs font-bold w-14 text-right" style={{ fontFamily: 'Source Code Pro, monospace' }}>
          {format(redValue)}
        </span>
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#ff3366]/60 transition-all duration-300"
            style={{ width: `${maxVal > 0 ? (redValue / maxVal) * 100 : 0}%` }}
          />
          <div className="flex-1" />
          <div
            className="h-full bg-[#4488ff]/60 transition-all duration-300"
            style={{ width: `${maxVal > 0 ? (blueValue / maxVal) * 100 : 0}%` }}
          />
        </div>
        <span className="text-[#4488ff] text-xs font-bold w-14" style={{ fontFamily: 'Source Code Pro, monospace' }}>
          {format(blueValue)}
        </span>
      </div>
    </div>
  );
}

function SurvivalRing({ stats, color }: { stats: TeamStats | null; color: string }) {
  const rate = stats ? stats.survivalRate : 0;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - rate);

  return (
    <div className="flex flex-col items-center">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#1a2a3a" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          className="transition-all duration-500"
        />
        <text
          x="22"
          y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          style={{ fontFamily: 'Source Code Pro, monospace' }}
        >
          {Math.round(rate * 100)}%
        </text>
      </svg>
      <span className="text-[8px] text-gray-500 mt-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>存活率</span>
    </div>
  );
}

export default function StatsPanel() {
  const redStats = useBattleStore((s) => s.redStats);
  const blueStats = useBattleStore((s) => s.blueStats);
  const battleTime = useBattleStore((s) => s.battleTime);
  const winner = useBattleStore((s) => s.winner);
  const simState = useBattleStore((s) => s.simState);

  const maxDps = Math.max(redStats?.dps ?? 0, blueStats?.dps ?? 0, 1);
  const maxDamage = Math.max(redStats?.totalDamageDealt ?? 0, blueStats?.totalDamageDealt ?? 0, 1);
  const maxKills = Math.max(redStats?.kills ?? 0, blueStats?.kills ?? 0, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider">
        <TrendingUp size={12} />
        <span>战斗统计</span>
        <span className="ml-auto" style={{ fontFamily: 'Source Code Pro, monospace' }}>
          {formatTime(battleTime)}
        </span>
      </div>

      <div className="flex justify-around">
        <SurvivalRing stats={redStats} color="#ff3366" />
        <SurvivalRing stats={blueStats} color="#4488ff" />
      </div>

      <StatBar
        label="DPS"
        redValue={redStats?.dps ?? 0}
        blueValue={blueStats?.dps ?? 0}
        maxVal={maxDps}
        format={(v) => v.toFixed(1)}
      />

      <StatBar
        label={<><Swords size={10} /> 总伤害</>}
        redValue={redStats?.totalDamageDealt ?? 0}
        blueValue={blueStats?.totalDamageDealt ?? 0}
        maxVal={maxDamage}
        format={(v) => Math.round(v).toString()}
      />

      <StatBar
        label={<><Skull size={10} /> 击杀</>}
        redValue={redStats?.kills ?? 0}
        blueValue={blueStats?.kills ?? 0}
        maxVal={maxKills}
        format={(v) => v.toString()}
      />

      <StatBar
        label={<><Heart size={10} /> 存活</>}
        redValue={redStats?.aliveCount ?? 0}
        blueValue={blueStats?.aliveCount ?? 0}
        maxVal={Math.max(redStats?.totalCount ?? 1, blueStats?.totalCount ?? 1)}
        format={(v) => v.toString()}
      />

      {simState === 'finished' && (
        <div className={`text-center py-2 rounded border ${
          winner === 'red'
            ? 'border-[#ff3366]/40 bg-[#ff3366]/10 text-[#ff3366]'
            : winner === 'blue'
              ? 'border-[#4488ff]/40 bg-[#4488ff]/10 text-[#4488ff]'
              : 'border-gray-500/40 bg-gray-500/10 text-gray-400'
        }`}>
          <div className="text-lg font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {winner === 'red' ? 'RED WINS' : winner === 'blue' ? 'BLUE WINS' : 'DRAW'}
          </div>
          <div className="text-[10px] opacity-60">战斗结束</div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
