import { useRef, useEffect, useCallback } from 'react';
import { useBattleStore } from '../store/battleStore';
import { distance } from '../utils/math';

export default function BattleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const simulator = useBattleStore((s) => s.simulator);
  const speed = useBattleStore((s) => s.speed);
  const simState = useBattleStore((s) => s.simState);
  const initSimulator = useBattleStore((s) => s.initSimulator);
  const updateStats = useBattleStore((s) => s.updateStats);
  const setHoveredShip = useBattleStore((s) => s.setHoveredShip);
  const hoveredShipId = useBattleStore((s) => s.hoveredShipId);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (simulator) {
      simulator.movementSystem.setWorldSize(rect.width, rect.height);
      simulator.width = rect.width;
      simulator.height = rect.height;
    }
  }, [simulator]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    initSimulator(rect.width, rect.height);

    updateSize();
  }, []);

  useEffect(() => {
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize]);

  useEffect(() => {
    lastTimeRef.current = 0;

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      dt = Math.min(dt, 0.05) * speed;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !simulator) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      simulator.update(dt);

      simulator.renderSystem.setContext(ctx, rect.width, rect.height);
      simulator.renderSystem.update(simulator.world, dt);
      simulator.renderSystem.renderProjectiles(simulator.attackSystem.projectiles);
      simulator.renderSystem.renderExplosions(dt);

      updateStats();

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [simulator, speed, updateStats]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!simulator) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const ships = simulator.getAllAliveShips();
      let closestId: number | null = null;
      let closestDist = 20;

      for (const ship of ships) {
        const dist = distance(mx, my, ship.x, ship.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = ship.id;
        }
      }

      setHoveredShip(closestId);
    },
    [simulator, setHoveredShip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredShip(null);
  }, [setHoveredShip]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {simState === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-[#00ff88] text-3xl font-bold tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              FLEET COMMAND
            </div>
            <div className="text-[#00ff88]/60 text-sm mt-2 tracking-wider">
              配置舰队参数后点击「开战」启动模拟
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
