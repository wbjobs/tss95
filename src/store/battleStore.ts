import { create } from 'zustand';
import { BattleSimulator, type TeamStats } from '../simulator/BattleSimulator';
import type { TacticMode } from '../ecs/components/AIComponent';
import type { Team } from '../ecs/components/TeamComponent';

export type SimState = 'idle' | 'running' | 'paused' | 'finished' | 'replay';

interface BattleStore {
  simulator: BattleSimulator | null;
  simState: SimState;
  speed: number;
  redCount: number;
  blueCount: number;
  redTactic: TacticMode;
  blueTactic: TacticMode;
  redStats: TeamStats | null;
  blueStats: TeamStats | null;
  battleTime: number;
  winner: Team | null;
  hoveredShipId: number | null;
  replayFrameIndex: number;
  replayTotalFrames: number;
  replayPlaying: boolean;
  replaySpeed: number;
  selectedShipIdForChart: number | null;

  initSimulator: (width: number, height: number) => void;
  startBattle: () => void;
  pauseBattle: () => void;
  resumeBattle: () => void;
  resetBattle: () => void;
  setSpeed: (speed: number) => void;
  setRedCount: (count: number) => void;
  setBlueCount: (count: number) => void;
  setRedTactic: (tactic: TacticMode) => void;
  setBlueTactic: (tactic: TacticMode) => void;
  addShips: (team: Team, count: number) => void;
  removeShips: (team: Team, count: number) => void;
  updateStats: () => void;
  setHoveredShip: (id: number | null) => void;
  startReplay: () => void;
  stopReplay: () => void;
  setReplayFrame: (index: number) => void;
  toggleReplayPlay: () => void;
  setReplaySpeed: (speed: number) => void;
  setSelectedShipForChart: (id: number | null) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  simulator: null,
  simState: 'idle',
  speed: 1,
  redCount: 5,
  blueCount: 5,
  redTactic: 'default',
  blueTactic: 'default',
  redStats: null,
  blueStats: null,
  battleTime: 0,
  winner: null,
  hoveredShipId: null,
  replayFrameIndex: 0,
  replayTotalFrames: 0,
  replayPlaying: false,
  replaySpeed: 1,
  selectedShipIdForChart: null,

  initSimulator: (width, height) => {
    const sim = new BattleSimulator(width, height);
    set({ simulator: sim });
  },

  startBattle: () => {
    const { simulator, redCount, blueCount, redTactic, blueTactic } = get();
    if (!simulator) return;
    simulator.reset();
    simulator.spawnFleet('red', redCount, redTactic);
    simulator.spawnFleet('blue', blueCount, blueTactic);
    simulator.isRunning = true;
    set({ simState: 'running', winner: null });
  },

  pauseBattle: () => {
    const { simulator } = get();
    if (simulator) simulator.isRunning = false;
    set({ simState: 'paused' });
  },

  resumeBattle: () => {
    const { simulator } = get();
    if (simulator) simulator.isRunning = true;
    set({ simState: 'running' });
  },

  resetBattle: () => {
    const { simulator } = get();
    if (simulator) simulator.reset();
    set({ simState: 'idle', winner: null, battleTime: 0, redStats: null, blueStats: null });
  },

  setSpeed: (speed) => set({ speed }),

  setRedCount: (count) => {
    const { simState } = get();
    if (simState !== 'idle') return;
    set({ redCount: Math.max(1, Math.min(100, count)) });
  },

  setBlueCount: (count) => {
    const { simState } = get();
    if (simState !== 'idle') return;
    set({ blueCount: Math.max(1, Math.min(100, count)) });
  },

  setRedTactic: (tactic) => {
    set({ redTactic: tactic });
    const { simulator } = get();
    if (simulator) simulator.setTactic('red', tactic);
  },

  setBlueTactic: (tactic) => {
    set({ blueTactic: tactic });
    const { simulator } = get();
    if (simulator) simulator.setTactic('blue', tactic);
  },

  addShips: (team, count) => {
    const { simulator } = get();
    if (!simulator) return;
    const tactic = team === 'red' ? get().redTactic : get().blueTactic;
    simulator.addShips(team, count, tactic);
  },

  removeShips: (team, count) => {
    const { simulator } = get();
    if (simulator) simulator.removeShips(team, count);
  },

  updateStats: () => {
    const { simulator, simState } = get();
    if (!simulator) return;
    const redStats = simulator.getTeamStats('red');
    const blueStats = simulator.getTeamStats('blue');
    set({
      redStats,
      blueStats,
      battleTime: simulator.battleTime,
    });
    if (simulator.isFinished && simState !== 'replay') {
      set({ simState: 'finished', winner: simulator.winner });
    }
  },

  setHoveredShip: (id) => set({ hoveredShipId: id }),

  startReplay: () => {
    const { simulator } = get();
    if (!simulator || !simulator.replayStore.hasData()) return;
    simulator.startReplay();
    set({
      simState: 'replay',
      replayFrameIndex: 0,
      replayTotalFrames: simulator.replayStore.getTotalFrames(),
      replayPlaying: true,
      replaySpeed: 1,
    });
  },

  stopReplay: () => {
    const { simulator } = get();
    if (!simulator) return;
    simulator.stopReplay();
    set({
      simState: 'finished',
      selectedShipIdForChart: null,
    });
  },

  setReplayFrame: (index) => {
    const { simulator } = get();
    if (!simulator) return;
    simulator.setReplayFrame(index);
    set({ replayFrameIndex: index });
  },

  toggleReplayPlay: () => {
    const { simulator, replayPlaying } = get();
    if (!simulator) return;
    simulator.toggleReplayPlay();
    set({ replayPlaying: !replayPlaying });
  },

  setReplaySpeed: (speed) => {
    const { simulator } = get();
    if (!simulator) return;
    simulator.setReplaySpeed(speed);
    set({ replaySpeed: speed });
  },

  setSelectedShipForChart: (id) => set({ selectedShipIdForChart: id }),
}));
