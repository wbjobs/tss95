import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { WeaponComponent } from '../components/WeaponComponent';
import type { AIComponent } from '../components/AIComponent';
import type { TeamComponent } from '../components/TeamComponent';
import { distance, normalize } from '../../utils/math';

interface ShipData {
  id: number;
  pos: PositionComponent;
  vel: VelocityComponent;
  health: HealthComponent;
  weapon: WeaponComponent;
  ai: AIComponent;
  team: TeamComponent;
}

interface TargetData {
  id: number;
  pos: PositionComponent;
  health: HealthComponent;
  weapon: WeaponComponent;
  attackers: number;
  score: number;
}

export class AIDecisionSystem extends System {
  readonly requiredComponents = ['position', 'velocity', 'health', 'weapon', 'ai', 'team'];

  private redShips: ShipData[] = [];
  private blueShips: ShipData[] = [];
  private redTargets: TargetData[] = [];
  private blueTargets: TargetData[] = [];

  private maxAttackersPerTarget: number = 3;
  private overkillThreshold: number = 1.5;

  update(world: World, _dt: number): void {
    this.collectEntities(world);
    this.assignTargets();
    this.updateBehaviors();
  }

  private collectEntities(world: World): void {
    this.redShips = [];
    this.blueShips = [];
    this.redTargets = [];
    this.blueTargets = [];

    const entities = world.getEntitiesWith('position', 'velocity', 'health', 'weapon', 'ai', 'team');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const vel = world.getComponent<VelocityComponent>(id, 'velocity');
      const health = world.getComponent<HealthComponent>(id, 'health');
      const weapon = world.getComponent<WeaponComponent>(id, 'weapon');
      const ai = world.getComponent<AIComponent>(id, 'ai');
      const team = world.getComponent<TeamComponent>(id, 'team');

      if (!pos || !vel || !health || !weapon || !ai || !team) continue;

      const data: ShipData = { id, pos, vel, health, weapon, ai, team };

      if (team.team === 'red') {
        this.redShips.push(data);
      } else {
        this.blueShips.push(data);
      }

      if (health.alive) {
        const targetData: TargetData = { id, pos, health, weapon, attackers: 0, score: 0 };
        if (team.team === 'red') {
          this.redTargets.push(targetData);
        } else {
          this.blueTargets.push(targetData);
        }
      }
    }
  }

  private assignTargets(): void {
    this.assignTargetsForTeam(this.redShips, this.blueTargets);
    this.assignTargetsForTeam(this.blueShips, this.redTargets);
  }

  private assignTargetsForTeam(ships: ShipData[], targets: TargetData[]): void {
    if (targets.length === 0) {
      for (const ship of ships) {
        ship.ai.targetId = null;
        ship.ai.state = 'idle';
      }
      return;
    }

    for (const target of targets) {
      target.attackers = 0;
    }

    for (const ship of ships) {
      if (!ship.health.alive) {
        ship.ai.targetId = null;
        continue;
      }

      const hpRatio = ship.health.hp / ship.health.maxHp;
      if (hpRatio < ship.ai.fleeThreshold) {
        ship.ai.targetId = null;
        continue;
      }

      let bestTarget: TargetData | null = null;
      let bestScore = -Infinity;

      for (const target of targets) {
        if (!target.health.alive || target.id === ship.id) continue;

        const dist = distance(ship.pos.x, ship.pos.y, target.pos.x, target.pos.y);
        if (dist > ship.weapon.range * 2.5) continue;

        const dpsEstimate = target.weapon.damage / target.weapon.maxCooldown;
        const timeToKill = target.health.hp / (ship.weapon.damage / ship.weapon.maxCooldown);
        const overkillPenalty = target.attackers >= this.maxAttackersPerTarget
          ? (target.attackers - this.maxAttackersPerTarget + 1) * 0.3
          : 0;

        let score = 0;
        const hpFactor = 1 - target.health.hp / target.health.maxHp;

        switch (ship.ai.tacticMode) {
          case 'focus_fire':
            score = hpFactor * 2 - dist / 1000 - overkillPenalty * 3 + target.attackers * 0.1;
            break;
          case 'guerrilla':
            score = -dist / 100 - overkillPenalty * 0.5 + hpFactor * 0.5;
            break;
          default:
            score = hpFactor - dist / 500 - overkillPenalty;
            break;
        }

        const expectedDpsToTarget = (ship.weapon.damage / ship.weapon.maxCooldown) * (1 - overkillPenalty * 0.5);
        const willOverkill = target.health.hp < expectedDpsToTarget * this.overkillThreshold && target.attackers > 0;
        if (willOverkill && ship.ai.tacticMode !== 'focus_fire') {
          score -= 1.5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        ship.ai.targetId = bestTarget.id;
        bestTarget.attackers++;
      } else {
        ship.ai.targetId = this.findNearestTarget(ship, targets);
        if (ship.ai.targetId !== null) {
          const t = targets.find((t) => t.id === ship.ai.targetId);
          if (t) t.attackers++;
        }
      }
    }
  }

  private findNearestTarget(ship: ShipData, targets: TargetData[]): number | null {
    let nearestId: number | null = null;
    let nearestDist = Infinity;

    for (const target of targets) {
      if (!target.health.alive || target.id === ship.id) continue;
      const dist = distance(ship.pos.x, ship.pos.y, target.pos.x, target.pos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = target.id;
      }
    }
    return nearestId;
  }

  private updateBehaviors(): void {
    for (const ship of this.redShips) {
      this.updateShipBehavior(ship);
    }
    for (const ship of this.blueShips) {
      this.updateShipBehavior(ship);
    }
  }

  private updateShipBehavior(ship: ShipData): void {
    if (!ship.health.alive) return;

    const hpRatio = ship.health.hp / ship.health.maxHp;

    if (hpRatio < ship.ai.fleeThreshold) {
      this.executeFlee(ship);
      return;
    }

    if (ship.ai.targetId === null) {
      ship.ai.state = 'idle';
      ship.vel.vx *= 0.95;
      ship.vel.vy *= 0.95;
      return;
    }

    const targetPos = this.getTargetPos(ship);
    if (!targetPos) {
      ship.ai.targetId = null;
      ship.ai.state = 'idle';
      return;
    }

    const dist = distance(ship.pos.x, ship.pos.y, targetPos.x, targetPos.y);

    switch (ship.ai.tacticMode) {
      case 'focus_fire':
        this.focusFireBehavior(ship, targetPos, dist);
        break;
      case 'guerrilla':
        this.guerrillaBehavior(ship, targetPos, dist);
        break;
      default:
        this.defaultBehavior(ship, targetPos, dist);
        break;
    }
  }

  private getTargetPos(ship: ShipData): PositionComponent | null {
    const targets = ship.team.team === 'red' ? this.blueTargets : this.redTargets;
    const target = targets.find((t) => t.id === ship.ai.targetId);
    return target?.health.alive ? target.pos : null;
  }

  private executeFlee(ship: ShipData): void {
    ship.ai.state = 'flee';
    const enemies = ship.team.team === 'red' ? this.blueTargets : this.redTargets;
    let nearest: { x: number; y: number } | null = null;
    let nearestDist = Infinity;

    for (const e of enemies) {
      if (!e.health.alive) continue;
      const dist = distance(ship.pos.x, ship.pos.y, e.pos.x, e.pos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { x: e.pos.x, y: e.pos.y };
      }
    }

    if (nearest) {
      const [nx, ny] = normalize(ship.pos.x - nearest.x, ship.pos.y - nearest.y);
      ship.vel.vx = nx * ship.vel.maxSpeed;
      ship.vel.vy = ny * ship.vel.maxSpeed;
    } else {
      ship.vel.vx *= 0.95;
      ship.vel.vy *= 0.95;
    }
  }

  private focusFireBehavior(ship: ShipData, target: PositionComponent, dist: number): void {
    ship.ai.state = dist <= ship.weapon.range ? 'attack' : 'chase';

    if (dist > ship.ai.preferredDistance) {
      const [nx, ny] = normalize(target.x - ship.pos.x, target.y - ship.pos.y);
      ship.vel.vx = nx * ship.vel.maxSpeed;
      ship.vel.vy = ny * ship.vel.maxSpeed;
    } else if (dist < ship.ai.preferredDistance * 0.5) {
      const [nx, ny] = normalize(ship.pos.x - target.x, ship.pos.y - target.y);
      ship.vel.vx = nx * ship.vel.maxSpeed * 0.4;
      ship.vel.vy = ny * ship.vel.maxSpeed * 0.4;
    } else {
      const angle = Math.atan2(target.y - ship.pos.y, target.x - ship.pos.x) + Math.PI / 3;
      ship.vel.vx = Math.cos(angle) * ship.vel.maxSpeed * 0.5;
      ship.vel.vy = Math.sin(angle) * ship.vel.maxSpeed * 0.5;
    }
  }

  private guerrillaBehavior(ship: ShipData, target: PositionComponent, dist: number): void {
    if (dist <= ship.weapon.range && ship.weapon.cooldown <= 0.2) {
      ship.ai.state = 'attack';
      const [nx, ny] = normalize(ship.pos.x - target.x, ship.pos.y - target.y);
      ship.vel.vx = nx * ship.vel.maxSpeed * 0.2;
      ship.vel.vy = ny * ship.vel.maxSpeed * 0.2;
    } else if (dist <= ship.ai.preferredDistance * 0.6) {
      ship.ai.state = 'flee';
      const [nx, ny] = normalize(ship.pos.x - target.x, ship.pos.y - target.y);
      ship.vel.vx = nx * ship.vel.maxSpeed;
      ship.vel.vy = ny * ship.vel.maxSpeed;
    } else if (dist > ship.weapon.range * 1.1) {
      ship.ai.state = 'chase';
      const [nx, ny] = normalize(target.x - ship.pos.x, target.y - ship.pos.y);
      ship.vel.vx = nx * ship.vel.maxSpeed;
      ship.vel.vy = ny * ship.vel.maxSpeed;
    } else {
      ship.ai.state = 'attack';
      const angle = Math.atan2(target.y - ship.pos.y, target.x - ship.pos.x) + Math.PI / 2;
      ship.vel.vx = Math.cos(angle) * ship.vel.maxSpeed * 0.6;
      ship.vel.vy = Math.sin(angle) * ship.vel.maxSpeed * 0.6;
    }
  }

  private defaultBehavior(ship: ShipData, target: PositionComponent, dist: number): void {
    if (dist > ship.weapon.range) {
      ship.ai.state = 'chase';
      const [nx, ny] = normalize(target.x - ship.pos.x, target.y - ship.pos.y);
      ship.vel.vx = nx * ship.vel.maxSpeed;
      ship.vel.vy = ny * ship.vel.maxSpeed;
    } else if (dist < ship.ai.preferredDistance * 0.4) {
      ship.ai.state = 'attack';
      const [nx, ny] = normalize(ship.pos.x - target.x, ship.pos.y - target.y);
      ship.vel.vx = nx * ship.vel.maxSpeed * 0.3;
      ship.vel.vy = ny * ship.vel.maxSpeed * 0.3;
    } else {
      ship.ai.state = 'attack';
      const angle = Math.atan2(target.y - ship.pos.y, target.x - ship.pos.x) + Math.PI / 4;
      ship.vel.vx = Math.cos(angle) * ship.vel.maxSpeed * 0.4;
      ship.vel.vy = Math.sin(angle) * ship.vel.maxSpeed * 0.4;
    }
  }
}
