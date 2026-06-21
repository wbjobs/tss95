import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { WeaponComponent } from '../components/WeaponComponent';
import type { AIComponent } from '../components/AIComponent';
import type { TeamComponent } from '../components/TeamComponent';
import { distance, angleBetween, normalize } from '../../utils/math';

export class AIDecisionSystem extends System {
  readonly requiredComponents = ['position', 'velocity', 'health', 'weapon', 'ai', 'team'];

  update(world: World, _dt: number): void {
    const entities = world.getEntitiesWith('position', 'velocity', 'health', 'weapon', 'ai', 'team');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const vel = world.getComponent<VelocityComponent>(id, 'velocity');
      const health = world.getComponent<HealthComponent>(id, 'health');
      const weapon = world.getComponent<WeaponComponent>(id, 'weapon');
      const ai = world.getComponent<AIComponent>(id, 'ai');
      const team = world.getComponent<TeamComponent>(id, 'team');
      if (!pos || !vel || !health || !weapon || !ai || !team || !health.alive) continue;

      const hpRatio = health.hp / health.maxHp;

      if (hpRatio < ai.fleeThreshold) {
        this.executeFlee(world, id, pos, vel, ai);
        continue;
      }

      switch (ai.tacticMode) {
        case 'focus_fire':
          this.executeFocusFire(world, id, pos, vel, weapon, ai, team);
          break;
        case 'guerrilla':
          this.executeGuerrilla(world, id, pos, vel, weapon, ai, team);
          break;
        default:
          this.executeDefault(world, id, pos, vel, weapon, ai, team);
          break;
      }
    }
  }

  private executeFlee(
    world: World,
    _id: number,
    pos: PositionComponent,
    vel: VelocityComponent,
    ai: AIComponent
  ): void {
    ai.state = 'flee';
    const nearest = this.findNearestEnemy(world, pos, _id);
    if (nearest) {
      const angle = angleBetween(nearest.x, nearest.y, pos.x, pos.y);
      vel.vx = Math.cos(angle) * vel.maxSpeed;
      vel.vy = Math.sin(angle) * vel.maxSpeed;
    } else {
      vel.vx *= 0.95;
      vel.vy *= 0.95;
    }
    ai.targetId = null;
  }

  private executeFocusFire(
    world: World,
    id: number,
    pos: PositionComponent,
    vel: VelocityComponent,
    weapon: WeaponComponent,
    ai: AIComponent,
    team: TeamComponent
  ): void {
    const teamFocusTarget = this.getTeamFocusTarget(world, team.team);
    if (teamFocusTarget !== null) {
      ai.targetId = teamFocusTarget;
    } else {
      const weakest = this.findWeakestEnemy(world, pos, id, team.team);
      ai.targetId = weakest;
    }

    if (ai.targetId !== null) {
      const targetPos = world.getComponent<PositionComponent>(ai.targetId, 'position');
      const targetHealth = world.getComponent<HealthComponent>(ai.targetId, 'health');
      if (!targetPos || !targetHealth || !targetHealth.alive) {
        ai.targetId = null;
        return;
      }

      const dist = distance(pos.x, pos.y, targetPos.x, targetPos.y);
      ai.state = dist <= weapon.range ? 'attack' : 'chase';

      if (dist > ai.preferredDistance) {
        const [nx, ny] = normalize(targetPos.x - pos.x, targetPos.y - pos.y);
        vel.vx = nx * vel.maxSpeed;
        vel.vy = ny * vel.maxSpeed;
      } else if (dist < ai.preferredDistance * 0.6) {
        const [nx, ny] = normalize(pos.x - targetPos.x, pos.y - targetPos.y);
        vel.vx = nx * vel.maxSpeed * 0.5;
        vel.vy = ny * vel.maxSpeed * 0.5;
      } else {
        vel.vx *= 0.9;
        vel.vy *= 0.9;
      }
    } else {
      ai.state = 'idle';
      vel.vx *= 0.95;
      vel.vy *= 0.95;
    }
  }

  private executeGuerrilla(
    world: World,
    id: number,
    pos: PositionComponent,
    vel: VelocityComponent,
    weapon: WeaponComponent,
    ai: AIComponent,
    team: TeamComponent
  ): void {
    const nearest = this.findNearestEnemy(world, pos, id);
    if (!nearest) {
      ai.state = 'idle';
      ai.targetId = null;
      vel.vx *= 0.95;
      vel.vy *= 0.95;
      return;
    }

    ai.targetId = nearest.id;
    const dist = distance(pos.x, pos.y, nearest.x, nearest.y);

    if (dist <= weapon.range && weapon.cooldown <= 0.2) {
      ai.state = 'attack';
      const [nx, ny] = normalize(pos.x - nearest.x, pos.y - nearest.y);
      vel.vx = nx * vel.maxSpeed * 0.3;
      vel.vy = ny * vel.maxSpeed * 0.3;
    } else if (dist <= ai.preferredDistance * 0.7) {
      ai.state = 'flee';
      const [nx, ny] = normalize(pos.x - nearest.x, pos.y - nearest.y);
      vel.vx = nx * vel.maxSpeed;
      vel.vy = ny * vel.maxSpeed;
    } else if (dist > weapon.range) {
      ai.state = 'chase';
      const [nx, ny] = normalize(nearest.x - pos.x, nearest.y - pos.y);
      vel.vx = nx * vel.maxSpeed;
      vel.vy = ny * vel.maxSpeed;
    } else {
      ai.state = 'attack';
      const angle = Math.atan2(nearest.y - pos.y, nearest.x - pos.x) + Math.PI / 2;
      vel.vx = Math.cos(angle) * vel.maxSpeed * 0.5;
      vel.vy = Math.sin(angle) * vel.maxSpeed * 0.5;
    }
  }

  private executeDefault(
    world: World,
    id: number,
    pos: PositionComponent,
    vel: VelocityComponent,
    weapon: WeaponComponent,
    ai: AIComponent,
    team: TeamComponent
  ): void {
    const nearest = this.findNearestEnemy(world, pos, id);
    if (!nearest) {
      ai.state = 'idle';
      ai.targetId = null;
      vel.vx *= 0.95;
      vel.vy *= 0.95;
      return;
    }

    ai.targetId = nearest.id;
    const dist = distance(pos.x, pos.y, nearest.x, nearest.y);

    if (dist > weapon.range) {
      ai.state = 'chase';
      const [nx, ny] = normalize(nearest.x - pos.x, nearest.y - pos.y);
      vel.vx = nx * vel.maxSpeed;
      vel.vy = ny * vel.maxSpeed;
    } else if (dist < ai.preferredDistance * 0.5) {
      ai.state = 'attack';
      const [nx, ny] = normalize(pos.x - nearest.x, pos.y - nearest.y);
      vel.vx = nx * vel.maxSpeed * 0.4;
      vel.vy = ny * vel.maxSpeed * 0.4;
    } else {
      ai.state = 'attack';
      const angle = Math.atan2(nearest.y - pos.y, nearest.x - pos.x) + Math.PI / 4;
      vel.vx = Math.cos(angle) * vel.maxSpeed * 0.3;
      vel.vy = Math.sin(angle) * vel.maxSpeed * 0.3;
    }
  }

  private findNearestEnemy(
    world: World,
    selfPos: PositionComponent,
    selfId: number
  ): { id: number; x: number; y: number } | null {
    let nearest: { id: number; x: number; y: number } | null = null;
    let nearestDist = Infinity;

    const enemies = world.getEntitiesWith('position', 'health', 'team');
    const selfTeam = world.getComponent<TeamComponent>(selfId, 'team');
    if (!selfTeam) return null;

    for (const eid of enemies) {
      if (eid === selfId) continue;
      const eTeam = world.getComponent<TeamComponent>(eid, 'team');
      const ePos = world.getComponent<PositionComponent>(eid, 'position');
      const eHealth = world.getComponent<HealthComponent>(eid, 'health');
      if (!eTeam || eTeam.team === selfTeam.team || !ePos || !eHealth || !eHealth.alive) continue;

      const dist = distance(selfPos.x, selfPos.y, ePos.x, ePos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id: eid, x: ePos.x, y: ePos.y };
      }
    }
    return nearest;
  }

  private findWeakestEnemy(
    world: World,
    selfPos: PositionComponent,
    selfId: number,
    selfTeam: 'red' | 'blue'
  ): number | null {
    let weakestId: number | null = null;
    let lowestHp = Infinity;

    const enemies = world.getEntitiesWith('position', 'health', 'team');
    for (const eid of enemies) {
      if (eid === selfId) continue;
      const eTeam = world.getComponent<TeamComponent>(eid, 'team');
      const ePos = world.getComponent<PositionComponent>(eid, 'position');
      const eHealth = world.getComponent<HealthComponent>(eid, 'health');
      if (!eTeam || eTeam.team === selfTeam || !ePos || !eHealth || !eHealth.alive) continue;

      if (eHealth.hp < lowestHp) {
        lowestHp = eHealth.hp;
        weakestId = eid;
      }
    }
    return weakestId;
  }

  private getTeamFocusTarget(world: World, team: 'red' | 'blue'): number | null {
    const allies = world.getEntitiesWith('ai', 'team');
    const targetCounts = new Map<number, number>();

    for (const aid of allies) {
      const aTeam = world.getComponent<TeamComponent>(aid, 'team');
      const aAi = world.getComponent<AIComponent>(aid, 'ai');
      if (!aTeam || aTeam.team !== team || !aAi || aAi.targetId === null) continue;

      const tHealth = world.getComponent<HealthComponent>(aAi.targetId, 'health');
      if (!tHealth || !tHealth.alive) continue;

      targetCounts.set(aAi.targetId, (targetCounts.get(aAi.targetId) ?? 0) + 1);
    }

    if (targetCounts.size > 0) {
      let maxTarget: number | null = null;
      let maxCount = 0;
      for (const [targetId, count] of targetCounts) {
        if (count > maxCount) {
          maxCount = count;
          maxTarget = targetId;
        }
      }
      return maxTarget;
    }
    return null;
  }
}
