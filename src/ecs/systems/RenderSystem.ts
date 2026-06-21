import { System } from '../System';
import type { World } from '../World';
import type { PositionComponent } from '../components/PositionComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { TeamComponent } from '../components/TeamComponent';
import type { WeaponComponent } from '../components/WeaponComponent';
import type { AIComponent } from '../components/AIComponent';
import type { RenderComponent } from '../components/RenderComponent';
import type { Projectile } from './AttackSystem';

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
}

export class RenderSystem extends System {
  readonly requiredComponents = ['position', 'render', 'team', 'health'];
  private ctx: CanvasRenderingContext2D | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private _explosions: Explosion[] = [];
  private scanLineY: number = 0;

  get explosions(): Explosion[] {
    return this._explosions;
  }

  addExplosion(x: number, y: number): void {
    this._explosions.push({
      x,
      y,
      radius: 0,
      maxRadius: 25 + Math.random() * 15,
      alpha: 1.0,
      life: 0.6,
    });
  }

  setContext(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.ctx = ctx;
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  update(world: World, dt: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawGrid(ctx);
    this.drawScanLine(ctx, dt);

    const entities = world.getEntitiesWith('position', 'render', 'team', 'health');

    for (const id of entities) {
      const pos = world.getComponent<PositionComponent>(id, 'position');
      const render = world.getComponent<RenderComponent>(id, 'render');
      const team = world.getComponent<TeamComponent>(id, 'team');
      const health = world.getComponent<HealthComponent>(id, 'health');
      if (!pos || !render || !team || !health) continue;

      if (!health.alive) {
        this.drawDeathMarker(ctx, pos.x, pos.y);
        continue;
      }

      this.drawTrail(ctx, render, team.team);
      this.drawShip(ctx, pos, render, team.team, health);
      this.drawHealthBar(ctx, pos, health, render);
      this.drawWeaponRange(ctx, pos, id, world);
    }
  }

  renderProjectiles(projectiles: Projectile[]): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    for (const proj of projectiles) {
      const lifeRatio = proj.life / proj.maxLife;
      const alpha = Math.max(0.3, lifeRatio);
      const color = proj.team === 'red' ? `rgba(255, 51, 102, ${alpha})` : `rgba(68, 136, 255, ${alpha})`;

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      const tailLen = 12;
      const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) || 1;
      const tailX = proj.x - (proj.vx / speed) * tailLen;
      const tailY = proj.y - (proj.vy / speed) * tailLen;

      const grad = ctx.createLinearGradient(proj.x, proj.y, tailX, tailY);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  renderExplosions(dt: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const alive: Explosion[] = [];

    for (const exp of this._explosions) {
      exp.life -= dt;
      exp.radius += dt * 80;
      exp.alpha = Math.max(0, exp.life / 0.6);

      if (exp.life <= 0) continue;

      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 170, 0, ${exp.alpha * 0.3})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 200, ${exp.alpha * 0.6})`;
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const pAngle = (Math.PI * 2 * i) / 4 + exp.radius * 0.1;
        const pDist = exp.radius * 0.8;
        const px = exp.x + Math.cos(pAngle) * pDist;
        const py = exp.y + Math.sin(pAngle) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${exp.alpha * 0.8})`;
        ctx.fill();
      }

      alive.push(exp);
    }

    this._explosions = alive;
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = 60;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
    ctx.lineWidth = 1;

    for (let x = 0; x < this.canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
  }

  private drawScanLine(ctx: CanvasRenderingContext2D, dt: number): void {
    this.scanLineY += dt * 60;
    if (this.scanLineY > this.canvasHeight) this.scanLineY = 0;

    const grad = ctx.createLinearGradient(0, this.scanLineY - 30, 0, this.scanLineY + 30);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'rgba(0, 255, 136, 0.04)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.scanLineY - 30, this.canvasWidth, 60);
  }

  private drawTrail(ctx: CanvasRenderingContext2D, render: RenderComponent, team: 'red' | 'blue'): void {
    if (render.trail.length < 2) return;

    for (let i = 1; i < render.trail.length; i++) {
      const p = render.trail[i];
      const alpha = p.alpha * 0.4;
      const color = team === 'red' ? `rgba(255, 51, 102, ${alpha})` : `rgba(68, 136, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, render.size * 0.3 * p.alpha, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private drawShip(
    ctx: CanvasRenderingContext2D,
    pos: PositionComponent,
    render: RenderComponent,
    team: 'red' | 'blue',
    health: HealthComponent
  ): void {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.angle);

    const baseColor = team === 'red' ? '#ff3366' : '#4488ff';
    const glowColor = team === 'red' ? 'rgba(255, 51, 102, 0.3)' : 'rgba(68, 136, 255, 0.3)';

    ctx.beginPath();
    ctx.arc(0, 0, render.size + 6, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(render.size, 0);
    ctx.lineTo(-render.size * 0.7, -render.size * 0.6);
    ctx.lineTo(-render.size * 0.4, 0);
    ctx.lineTo(-render.size * 0.7, render.size * 0.6);
    ctx.closePath();

    if (render.flashTimer > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = baseColor;
    }
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    pos: PositionComponent,
    health: HealthComponent,
    render: RenderComponent
  ): void {
    const barWidth = render.size * 2.5;
    const barHeight = 3;
    const x = pos.x - barWidth / 2;
    const y = pos.y - render.size - 10;
    const hpRatio = health.hp / health.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    const hpColor = hpRatio > 0.6 ? '#00ff88' : hpRatio > 0.3 ? '#ffaa00' : '#ff3366';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
  }

  private drawWeaponRange(
    ctx: CanvasRenderingContext2D,
    pos: PositionComponent,
    id: number,
    world: World
  ): void {
    const weapon = world.getComponent<WeaponComponent>(id, 'weapon');
    const ai = world.getComponent<AIComponent>(id, 'ai');
    if (!weapon || !ai) return;

    if (ai.state === 'attack') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, weapon.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawDeathMarker(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.moveTo(x + 4, y - 4);
    ctx.lineTo(x - 4, y + 4);
    ctx.stroke();
  }
}
