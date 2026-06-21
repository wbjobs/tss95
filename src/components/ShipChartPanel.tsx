import { useEffect, useRef, useState } from 'react';
import { useBattleStore } from '../store/battleStore';
import { X, Heart, Target, Activity } from 'lucide-react';
import type { AIState } from '../ecs/components/AIComponent';

export default function ShipChartPanel() {
  const simulator = useBattleStore((s) => s.simulator);
  const simState = useBattleStore((s) => s.simState);
  const selectedShipId = useBattleStore((s) => s.selectedShipIdForChart);
  const setSelectedShipForChart = useBattleStore((s) => s.setSelectedShipForChart);
  const replayFrameIndex = useBattleStore((s) => s.replayFrameIndex);
  const battleTime = useBattleStore((s) => s.battleTime);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shipInfo, setShipInfo] = useState<{
    id: number;
    team: 'red' | 'blue';
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    aiState: string;
    targetId: number | null;
    weaponCooldown: number;
    size: number;
  } | null>(null);
  const [history, setHistory] = useState<{
    frameIndex: number;
    timestamp: number;
    hp: number;
    targetId: number | null;
    aiState: AIState;
  }[]>([]);

  useEffect(() => {
    if (!simulator || selectedShipId === null) {
      setShipInfo(null);
      setHistory([]);
      return;
    }

    const info = simulator.getShipInfo(selectedShipId);
    if (info) {
      setShipInfo(info);
    }

    const hist = simulator.replayStore.getShipHistory(selectedShipId);
    setHistory(hist);
  }, [simulator, selectedShipId]);

  useEffect(() => {
    if (!simulator || selectedShipId === null) return;
    const info = simulator.getShipInfo(selectedShipId);
    if (info) {
      setShipInfo(info);
    }
  }, [simulator, selectedShipId, replayFrameIndex, battleTime]);

  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    const maxHp = shipInfo?.maxHp ?? 100;
    const maxTime = history.length > 0 ? history[history.length - 1].timestamp : 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const hpVal = Math.round(maxHp - (maxHp / 5) * i);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "Source Code Pro", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(hpVal.toString(), padding.left - 5, y + 3);
    }

    const totalFrames = history.length;
    const xStep = totalFrames > 1 ? chartW / (totalFrames - 1) : 0;

    ctx.beginPath();
    ctx.strokeStyle = shipInfo?.team === 'red' ? '#ff3366' : '#4488ff';
    ctx.lineWidth = 2;

    for (let i = 0; i < history.length; i++) {
      const x = padding.left + i * xStep;
      const y = padding.top + chartH - (history[i].hp / maxHp) * chartH;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, shipInfo?.team === 'red' ? 'rgba(255, 51, 102, 0.3)' : 'rgba(68, 136, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    for (let i = 0; i < history.length; i++) {
      const x = padding.left + i * xStep;
      const y = padding.top + chartH - (history[i].hp / maxHp) * chartH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    const currentFramePos = history.findIndex((h) => h.frameIndex >= replayFrameIndex);
    if (currentFramePos >= 0 || (replayFrameIndex >= (history[history.length - 1]?.frameIndex ?? 0))) {
      const pos = currentFramePos >= 0 ? currentFramePos : history.length - 1;
      const x = padding.left + pos * xStep;
      const hp = history[pos]?.hp ?? 0;
      const y = padding.top + chartH - (hp / maxHp) * chartH;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = shipInfo?.team === 'red' ? '#ff3366' : '#4488ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px "Source Code Pro", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartW / 4) * i;
      const timeVal = (maxTime / 4) * i;
      ctx.fillText(timeVal.toFixed(1) + 's', x, padding.top + chartH + 18);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px "Source Code Pro", monospace';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(12, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('HP', 0, 0);
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', padding.left + chartW / 2, h - 5);
  }, [history, shipInfo, replayFrameIndex]);

  if (simState !== 'replay' || selectedShipId === null) {
    return null;
  }

  const stateColors: Record<string, string> = {
    idle: 'text-gray-400',
    chase: 'text-yellow-400',
    attack: 'text-red-400',
    flee: 'text-orange-400',
    regroup: 'text-blue-400',
  };

  const stateLabels: Record<string, string> = {
    idle: '待命',
    chase: '追击',
    attack: '攻击',
    flee: '撤退',
    regroup: '集结',
  };

  const getTargetInfo = () => {
    if (!simulator || !shipInfo?.targetId) return null;
    const targetInfo = simulator.getShipInfo(shipInfo.targetId);
    return targetInfo;
  };

  const targetInfo = getTargetInfo();

  return (
    <div className="absolute top-4 right-4 z-20 w-80">
      <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
        <div
          className={`flex items-center justify-between px-3 py-2 ${
            shipInfo?.team === 'red' ? 'bg-[#ff3366]/20' : 'bg-[#4488ff]/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity
              size={16}
              className={shipInfo?.team === 'red' ? 'text-[#ff3366]' : 'text-[#4488ff]'}
            />
            <span
              className="text-sm font-bold text-white tracking-wider"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              SHIP #{selectedShipId}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                shipInfo?.team === 'red' ? 'bg-[#ff3366]/30 text-[#ff3366]' : 'bg-[#4488ff]/30 text-[#4488ff]'
              }`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              {shipInfo?.team === 'red' ? 'RED' : 'BLUE'}
            </span>
          </div>
          <button
            onClick={() => setSelectedShipForChart(null)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                <Heart size={10} />
                生命值
              </div>
              <div
                className="text-lg font-bold text-white"
                style={{ fontFamily: 'Source Code Pro, monospace' }}
              >
                {Math.round(shipInfo?.hp ?? 0)}
                <span className="text-xs text-gray-500">/{shipInfo?.maxHp ?? 0}</span>
              </div>
              <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    shipInfo?.team === 'red' ? 'bg-[#ff3366]' : 'bg-[#4488ff]'
                  }`}
                  style={{ width: `${((shipInfo?.hp ?? 0) / (shipInfo?.maxHp ?? 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                <Activity size={10} />
                状态
              </div>
              <div
                className={`text-lg font-bold ${
                  stateColors[shipInfo?.aiState ?? 'idle'] ?? 'text-gray-400'
                }`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                {stateLabels[shipInfo?.aiState ?? 'idle'] ?? shipInfo?.aiState}
              </div>
              <div className="text-[10px] text-gray-500" style={{ fontFamily: 'Source Code Pro, monospace' }}>
                CD: {shipInfo?.weaponCooldown.toFixed(2)}s
              </div>
            </div>
          </div>

          {shipInfo?.targetId && (
            <div className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                <Target size={10} />
                当前目标
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    targetInfo?.team === 'red' ? 'text-[#ff3366]' : 'text-[#4488ff]'
                  }`}
                  style={{ fontFamily: 'Source Code Pro, monospace' }}
                >
                  #{shipInfo.targetId}
                </span>
                {targetInfo && (
                  <>
                    <span className="text-xs text-gray-400">HP:</span>
                    <span
                      className="text-sm font-medium text-white"
                      style={{ fontFamily: 'Source Code Pro, monospace' }}
                    >
                      {Math.round(targetInfo.hp)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
              HP 变化曲线
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-40 bg-black/40 rounded border border-gray-700/50"
            />
          </div>

          <div className="text-[10px] text-gray-500 text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            共记录 {history.length} 帧数据
          </div>
        </div>
      </div>
    </div>
  );
}
