import { useBattleStore } from '../store/battleStore';
import { Play, Pause, SkipBack, SkipForward, X, FastForward } from 'lucide-react';

export default function ReplayController() {
  const simState = useBattleStore((s) => s.simState);
  const replayFrameIndex = useBattleStore((s) => s.replayFrameIndex);
  const replayTotalFrames = useBattleStore((s) => s.replayTotalFrames);
  const replayPlaying = useBattleStore((s) => s.replayPlaying);
  const replaySpeed = useBattleStore((s) => s.replaySpeed);
  const battleTime = useBattleStore((s) => s.battleTime);

  const stopReplay = useBattleStore((s) => s.stopReplay);
  const toggleReplayPlay = useBattleStore((s) => s.toggleReplayPlay);
  const setReplayFrame = useBattleStore((s) => s.setReplayFrame);
  const setReplaySpeed = useBattleStore((s) => s.setReplaySpeed);

  if (simState !== 'replay') {
    return null;
  }

  const formatTime = (t: number): string => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const frame = Math.floor(ratio * (replayTotalFrames - 1));
    setReplayFrame(Math.max(0, Math.min(replayTotalFrames - 1, frame)));
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20">
      <div className="bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold text-[#00ff88] tracking-wider"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              REPLAY MODE
            </span>
            <span
              className="text-xs text-gray-400"
              style={{ fontFamily: 'Source Code Pro, monospace' }}
            >
              {formatTime(battleTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplayFrame(0)}
                  className="p-1.5 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="回到开始"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={() => setReplayFrame(Math.max(0, replayFrameIndex - 30))}
                  className="p-1.5 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="后退1秒"
                >
                  <FastForward size={16} className="rotate-180" />
                </button>
                <button
                  onClick={toggleReplayPlay}
                  className="p-2 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] rounded transition-colors"
                  title={replayPlaying ? '暂停' : '播放'}
                >
                  {replayPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={() => setReplayFrame(Math.min(replayTotalFrames - 1, replayFrameIndex + 30))}
                  className="p-1.5 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="前进1秒"
                >
                  <FastForward size={16} />
                </button>
                <button
                  onClick={() => setReplayFrame(replayTotalFrames - 1)}
                  className="p-1.5 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="跳到结尾"
                >
                  <SkipForward size={16} />
                </button>
                <div className="h-6 w-px bg-gray-600 mx-1" />
                <div className="flex gap-1">
                  {speedOptions.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setReplaySpeed(spd)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        replaySpeed === spd
                          ? 'bg-[#00ff88] text-black'
                          : 'bg-gray-700/50 text-gray-400 hover:text-white'
                      }`}
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
                <div className="h-6 w-px bg-gray-600 mx-1" />
                <button
                  onClick={stopReplay}
                  className="p-1.5 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  title="退出回放"
                >
                  <X size={16} />
                </button>
          </div>
        </div>

            <div
              className="h-2 bg-gray-700/50 rounded-full cursor-pointer overflow-hidden group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-gradient-to-r from-[#00ff88]/60 to-[#00ff88] transition-all duration-75 relative"
                style={{ width: `${(replayFrameIndex / Math.max(1, replayTotalFrames - 1)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500" style={{ fontFamily: 'Source Code Pro, monospace' }}>
              <span>Frame {replayFrameIndex} / {replayTotalFrames - 1}</span>
              <span>提示：点击船只查看属性变化曲线</span>
            </div>
      </div>
    </div>
  );
}
