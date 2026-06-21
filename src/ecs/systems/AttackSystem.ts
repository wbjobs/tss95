import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { WeaponComponent } from '../components/WeaponComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { AIComponent } from '../components/AIComponent';
import type { TeamComponent } from '../components/TeamComponent';
import type { RenderComponent } from '../components/RenderComponent';
import { distance } from '../../utils/math';

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sourceId: number;
  team: 'red' | 'blue';
  damage: number;
  life: number;
  maxLife: number;
}

export interface DamageEvent {
  sourceId: number;
  targetId: number;
  damage: number;
  timestamp: number;
}

let projectileIdCounter = 0;

export class AttackSystem extends System {
  readonly requiredComponents = ['position', 'weapon', 'health', 'team'];
  private _projectiles: Projectile[] = [];
  private _damageEvents: DamageEvent[] = [];
  private _killEvents: { killerId: number; victimId: number; timestamp: number }[] = [];
  private battleTime: number = 0;

  get projectiles(): Projectile[] {
    return this._projectiles;
  }

  get damageEvents(): DamageEvent[] {
    return this._damageEvents;
  }

  get killEvents(): { killerId: number; victimId: number; timestamp: number }[] {
    return this._killEvents;
  }

  reset(): void {
    this._projectiles = [];
    this._damageEvents = [];
    this._killEvents = [];
    this.battleTime = 0;
    projectileIdCounter = 0;
  }

  update(world: World, dt: number): void {
    this.battleTime += dt;
    const entities = world.getEntitiesWith('position', 'weapon', 'health', 'team');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const weapon = world.getComponent<WeaponComponent>(id, 'weapon');
      const health = world.getComponent<HealthComponent>(id, 'health');
      const team = world.getComponent<TeamComponent>(id, 'team');
      const ai = world.getComponent<AIComponent>(id, 'ai');
      if (!pos || !weapon || !health || !team || !health.alive) continue;

      weapon.cooldown = Math.max(0, weapon.cooldown - dt);

      if (weapon.cooldown > 0) continue;

      const targetId = ai?.targetId ?? this.findNearestEnemy(world, id, pos, team.team, weapon.range);
      if (targetId === null) continue;

      const targetPos = world.getComponent<PositionComponent>(targetId, 'position');
      const targetHealth = world.getComponent<HealthComponent>(targetId, 'health');
      if (!targetPos || !targetHealth || !targetHealth.alive) {
        if (ai) ai.targetId = null;
        continue;
      }

      const dist = distance(pos.x, pos.y, targetPos.x, targetPos.y);
      if (dist > weapon.range) continue;

      const angle = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);
      this._projectiles.push({
        id: ++projectileIdCounter,
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * weapon.projectileSpeed,
        vy: Math.sin(angle) * weapon.projectileSpeed,
        sourceId: id,
        team: team.team,
        damage: weapon.damage,
        life: dist / weapon.projectileSpeed + 0.1,
        maxLife: dist / weapon.projectileSpeed + 0.1,
      });

      weapon.cooldown = weapon.maxCooldown;
    }

    this.updateProjectiles(world, dt);
  }

  private findNearestEnemy(
    world: World,
    _selfId: number,
    selfPos: PositionComponent,
    selfTeam: 'red' | 'blue',
    range: number
  ): number | null {
    let nearestId: number | null = null;
    let nearestDist = range;

    const enemies = world.getEntitiesWith('position', 'health', 'team');
    for (const eid of enemies) {
      const eTeam = world.getComponent<TeamComponent>(eid, 'team');
      const ePos = world.getComponent<PositionComponent>(eid, 'position');
      const eHealth = world.getComponent<HealthComponent>(eid, 'health');
      if (!eTeam || eTeam.team === selfTeam || !ePos || !eHealth || !eHealth.alive) continue;

      const dist = distance(selfPos.x, selfPos.y, ePos.x, ePos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = eid;
      }
    }
    return nearestId;
  }

  private updateProjectiles(world: World, dt: number): void {
    const alive: Projectile[] = [];

    for (const proj of this._projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.life <= 0) continue;

      let hit = false;
      const targets = world.getEntitiesWith('position', 'health', 'team');
      for (const tid of targets) {
        const tPos = world.getComponent<PositionComponent>(tid, 'position');
        const tHealth = world.getComponent<HealthComponent>(tid, 'health');
        const tTeam = world.getComponent<TeamComponent>(tid, 'team');
        const tRender = world.getComponent<RenderComponent>(tid, 'render');
        if (!tPos || !tHealth || !tTeam || !tHealth.alive || tTeam.team === proj.team) continue;

        const hitRadius = tRender ? tRender.size + 4 : 14;
        const dist = distance(proj.x, proj.y, tPos.x, tPos.y);
        if (dist < hitRadius) {
          tHealth.hp -= proj.damage;
          if (tHealth.hp <= 0) {
            tHealth.hp = 0;
            tHealth.alive = false;
            this._killEvents.push({
              killerId: proj.sourceId,
              victimId: tid,
              timestamp: this.battleTime,
            });
          }

          const tRenderComp = world.getComponent<RenderComponent>(tid, 'render');
          if (tRenderComp) {
            tRenderComp.flashTimer = 0.15;
          }

          this._damageEvents.push({
            sourceId: proj.sourceId,
            targetId: tid,
            damage: proj.damage,
            timestamp: this.battleTime,
          });

          hit = true;
          break;
        }
      }

      if (!hit) {
        alive.push(proj);
      }
    }

    this._projectiles = alive;
  }
}
