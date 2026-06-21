import { World } from '../ecs/World';
import { createPositionComponent } from '../ecs/components/PositionComponent';
import { createVelocityComponent } from '../ecs/components/VelocityComponent';
import { createHealthComponent } from '../ecs/components/HealthComponent';
import { createWeaponComponent } from '../ecs/components/WeaponComponent';
import { createAIComponent, type TacticMode } from '../ecs/components/AIComponent';
import { createTeamComponent, type Team } from '../ecs/components/TeamComponent';
import { createRenderComponent } from '../ecs/components/RenderComponent';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { AttackSystem } from '../ecs/systems/AttackSystem';
import { AIDecisionSystem } from '../ecs/systems/AIDecisionSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';
import { randomRange } from '../utils/math';

export interface TeamStats {
  team: Team;
  aliveCount: number;
  totalCount: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  kills: number;
  dps: number;
  survivalRate: number;
}

export class BattleSimulator {
  world: World;
  movementSystem: MovementSystem;
  collisionSystem: CollisionSystem;
  attackSystem: AttackSystem;
  aiDecisionSystem: AIDecisionSystem;
  renderSystem: RenderSystem;
  battleTime: number = 0;
  isRunning: boolean = false;
  isFinished: boolean = false;
  winner: Team | null = null;
  width: number;
  height: number;

  private redDamageAccum: number = 0;
  private blueDamageAccum: number = 0;
  private redKills: number = 0;
  private blueKills: number = 0;
  private lastDamageEventIdx: number = 0;
  private lastKillEventIdx: number = 0;

  perfTimings: { ai: number; attack: number; movement: number; collision: number; total: number } = {
    ai: 0, attack: 0, movement: 0, collision: 0, total: 0
  };

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.world = new World();
    this.movementSystem = new MovementSystem(width, height);
    this.collisionSystem = new CollisionSystem();
    this.attackSystem = new AttackSystem();
    this.aiDecisionSystem = new AIDecisionSystem();
    this.renderSystem = new RenderSystem();

    this.world.addSystem(this.aiDecisionSystem);
    this.world.addSystem(this.attackSystem);
    this.world.addSystem(this.movementSystem);
    this.world.addSystem(this.collisionSystem);
  }

  spawnFleet(team: Team, count: number, tactic: TacticMode): void {
    const isRed = team === 'red';
    const baseX = isRed ? 100 : this.width - 100;
    const spacing = 55;
    const cols = Math.min(count, 4);

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = baseX + (isRed ? 1 : -1) * (row * spacing + randomRange(-12, 12));
      const y = this.height * 0.15 + (col + 1) * (this.height * 0.7 / (cols + 1)) + randomRange(-18, 18);
      const angle = isRed ? 0 : Math.PI;

      const id = this.world.createEntity();
      this.world.addComponent(id, createPositionComponent(x, y, angle));
      this.world.addComponent(id, createVelocityComponent(
        isRed ? randomRange(8, 20) : randomRange(-20, -8),
        randomRange(-4, 4),
        randomRange(70, 110)
      ));
      this.world.addComponent(id, createHealthComponent(randomRange(150, 220)));
      this.world.addComponent(id, createWeaponComponent(
        randomRange(8, 14),
        randomRange(180, 260),
        randomRange(1.0, 1.8),
        randomRange(280, 420)
      ));
      this.world.addComponent(id, createAIComponent(tactic));
      this.world.addComponent(id, createTeamComponent(team));
      this.world.addComponent(id, createRenderComponent(randomRange(11, 15)));
    }
  }

  addShips(team: Team, count: number, tactic: TacticMode): void {
    this.spawnFleet(team, count, tactic);
  }

  removeShips(team: Team, count: number): void {
    const entities = this.world.getEntitiesWith('team', 'health');
    let removed = 0;

    for (const id of entities) {
      if (removed >= count) break;
      const t = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
      const h = this.world.getComponent<{ type: 'health'; alive: boolean; hp: number }>(id, 'health');
      if (t && t.team === team && h && h.alive) {
        h.alive = false;
        h.hp = 0;
        removed++;
      }
    }
  }

  setTactic(team: Team, tactic: TacticMode): void {
    const entities = this.world.getEntitiesWith('ai', 'team');
    for (const id of entities) {
      const t = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
      const ai = this.world.getComponent<{ type: 'ai'; tacticMode: TacticMode }>(id, 'ai');
      if (t && t.team === team && ai) {
        ai.tacticMode = tactic;
      }
    }
  }

  update(dt: number): void {
    if (!this.isRunning || this.isFinished) return;

    this.battleTime += dt;

    const t0 = performance.now();

    const t1 = performance.now();
    this.aiDecisionSystem.update(this.world, dt);
    const t2 = performance.now();
    this.attackSystem.update(this.world, dt);
    const t3 = performance.now();
    this.movementSystem.update(this.world, dt);
    const t4 = performance.now();
    this.collisionSystem.update(this.world, dt);
    const t5 = performance.now();

    this.perfTimings.ai = t2 - t1;
    this.perfTimings.attack = t3 - t2;
    this.perfTimings.movement = t4 - t3;
    this.perfTimings.collision = t5 - t4;
    this.perfTimings.total = t5 - t0;

    this.processNewDamageEvents();
    this.processNewKillEvents();

    this.checkBattleEnd();
  }

  private processNewDamageEvents(): void {
    const events = this.attackSystem.damageEvents;
    for (let i = this.lastDamageEventIdx; i < events.length; i++) {
      const evt = events[i];
      const sourceTeam = this.world.getComponent<{ type: 'team'; team: Team }>(evt.sourceId, 'team');
      if (sourceTeam) {
        if (sourceTeam.team === 'red') this.redDamageAccum += evt.damage;
        else this.blueDamageAccum += evt.damage;
      }
    }
    this.lastDamageEventIdx = events.length;
  }

  private processNewKillEvents(): void {
    const events = this.attackSystem.killEvents;
    for (let i = this.lastKillEventIdx; i < events.length; i++) {
      const kill = events[i];
      const killerTeam = this.world.getComponent<{ type: 'team'; team: Team }>(kill.killerId, 'team');
      if (killerTeam) {
        if (killerTeam.team === 'red') this.redKills++;
        else this.blueKills++;
      }

      const victimPos = this.world.getComponent<{ type: 'position'; x: number; y: number }>(kill.victimId, 'position');
      if (victimPos) {
        this.renderSystem.addExplosion(victimPos.x, victimPos.y);
      }
    }
    this.lastKillEventIdx = events.length;
  }

  private checkBattleEnd(): void {
    const redAlive = this.getAliveCount('red');
    const blueAlive = this.getAliveCount('blue');

    if (redAlive === 0 || blueAlive === 0) {
      this.isFinished = true;
      this.isRunning = false;
      this.winner = redAlive > 0 ? 'red' : blueAlive > 0 ? 'blue' : null;
    }
  }

  getAliveCount(team: Team): number {
    let count = 0;
    const entities = this.world.getEntitiesWith('team', 'health');
    for (const id of entities) {
      const t = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
      const h = this.world.getComponent<{ type: 'health'; alive: boolean }>(id, 'health');
      if (t && t.team === team && h && h.alive) count++;
    }
    return count;
  }

  getTotalCount(team: Team): number {
    let count = 0;
    const entities = this.world.getEntitiesWith('team', 'health');
    for (const id of entities) {
      const t = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
      if (t && t.team === team) count++;
    }
    return count;
  }

  getTeamStats(team: Team): TeamStats {
    const alive = this.getAliveCount(team);
    const total = this.getTotalCount(team);
    const isRed = team === 'red';

    return {
      team,
      aliveCount: alive,
      totalCount: total,
      totalDamageDealt: isRed ? this.redDamageAccum : this.blueDamageAccum,
      totalDamageTaken: isRed ? this.blueDamageAccum : this.redDamageAccum,
      kills: isRed ? this.redKills : this.blueKills,
      dps: this.battleTime > 0 ? (isRed ? this.redDamageAccum : this.blueDamageAccum) / this.battleTime : 0,
      survivalRate: total > 0 ? alive / total : 0,
    };
  }

  getShipInfo(id: number): {
    hp: number;
    maxHp: number;
    weaponCooldown: number;
    maxCooldown: number;
    aiState: string;
    team: Team;
    x: number;
    y: number;
  } | null {
    const pos = this.world.getComponent<{ type: 'position'; x: number; y: number }>(id, 'position');
    const health = this.world.getComponent<{ type: 'health'; hp: number; maxHp: number }>(id, 'health');
    const weapon = this.world.getComponent<{ type: 'weapon'; cooldown: number; maxCooldown: number }>(id, 'weapon');
    const ai = this.world.getComponent<{ type: 'ai'; state: string }>(id, 'ai');
    const team = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
    if (!pos || !health || !weapon || !ai || !team) return null;

    return {
      hp: health.hp,
      maxHp: health.maxHp,
      weaponCooldown: weapon.cooldown,
      maxCooldown: weapon.maxCooldown,
      aiState: ai.state,
      team: team.team,
      x: pos.x,
      y: pos.y,
    };
  }

  getAllAliveShips(): { id: number; x: number; y: number; team: Team; size: number }[] {
    const result: { id: number; x: number; y: number; team: Team; size: number }[] = [];
    const entities = this.world.getEntitiesWith('position', 'team', 'health', 'render');
    for (const id of entities) {
      const pos = this.world.getComponent<{ type: 'position'; x: number; y: number }>(id, 'position');
      const team = this.world.getComponent<{ type: 'team'; team: Team }>(id, 'team');
      const health = this.world.getComponent<{ type: 'health'; alive: boolean }>(id, 'health');
      const render = this.world.getComponent<{ type: 'render'; size: number }>(id, 'render');
      if (pos && team && health && health.alive && render) {
        result.push({ id, x: pos.x, y: pos.y, team: team.team, size: render.size });
      }
    }
    return result;
  }

  reset(): void {
    this.world.clear();
    this.attackSystem.reset();
    this.battleTime = 0;
    this.isRunning = false;
    this.isFinished = false;
    this.winner = null;
    this.redDamageAccum = 0;
    this.blueDamageAccum = 0;
    this.redKills = 0;
    this.blueKills = 0;
    this.lastDamageEventIdx = 0;
    this.lastKillEventIdx = 0;
    this.renderSystem = new RenderSystem();
  }
}
