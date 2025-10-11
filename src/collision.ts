import type { Grid } from "./grid";
import type { Maze } from "./maze";
import type { GameMetadata } from "./metadata";
import type { AgentMovement, AgentRenderer, AgentSubscriber } from "./agent";
import type { GameObject } from "./gameObject";
import type { Player } from "./player";
import type { Enemy } from "./enemy";
import { throwConfetti } from "./confetti";

class CollisionHandler implements AgentSubscriber {
  private readonly grid: Grid;
  private readonly maze: Maze;
  private readonly player: Player;
  private readonly enemies: Enemy[];
  private readonly agents: (Player | Enemy)[];
  private readonly renderer: AgentRenderer;
  private readonly metadata: GameMetadata;
  private readonly transformingDuration: number;
  private readonly promotionDuration: number;
  private readonly playerWaiting: number;
  private readonly enemyWaiting: number;
  private lastPromotion?: number;

  constructor(
    props: {
      grid: Grid;
      maze: Maze;
      player: Player;
      enemies: Enemy[];
      renderer: AgentRenderer;
      metadata: GameMetadata;
      transformingDuration?: number;
      promotionDuration?: number;
      playerWaiting?: number;
      enemyWaiting?: number;
    }
  ) {
    this.grid = props.grid;
    this.maze = props.maze;
    this.player = props.player;
    this.enemies = props.enemies;
    this.agents = [this.player, ...this.enemies];
    this.renderer = props.renderer;
    this.metadata = props.metadata;
    this.transformingDuration = props.transformingDuration ?? 500;
    this.promotionDuration = props.promotionDuration ?? 8000;
    this.playerWaiting = props.playerWaiting ?? 4000;
    this.enemyWaiting = props.enemyWaiting ?? 5000;

    const css = document.styleSheets[0];
    css.insertRule(`.player.transforming::after {
      animation-duration: ${this.transformingDuration}ms !important;
    }`);

    for (const agent of this.agents) {
      this.wait(agent, this.playerWaiting);
    }
  }

  public async update(context: AgentMovement): Promise<void> {
    const [nextRow, nextColumn] = context.nextPosition;
    const target = this.grid.elements[nextRow][nextColumn];
    if (target.length == 0) return;

    const pellet = target.find(object => object.type == "pellet");
    if (pellet && context.agent.type == "player") {
      this.grid.remove(nextRow, nextColumn, pellet);
      this.player.variations.add("promoted");
      this.metadata.score += 50;

      this.playerTransformation().then(() => {
        clearTimeout(this.lastPromotion);

        this.lastPromotion = setTimeout(() => {
          this.player.variations.delete("promoted");
          this.playerTransformation();
        }, this.promotionDuration);
      });
    }

    const dot = target.find(object => object.type == "dot");
    if (dot && context.agent.type == "player") {
      this.grid.remove(nextRow, nextColumn, dot);
      this.metadata.score += 10;
    }

    let levelCleared = true;
    for (const row of this.grid.elements) {
      for (const objectList of row) {
        for (const object of objectList) {
          if (object.type == "dot" || object.type == "pellet") {
            levelCleared = false;
            break;
          }
        }
      }
    }

    if (levelCleared) {
      this.metadata.status = "Victory";
      throwConfetti();

      this.metadata.pauseClock();
      this.renderer.pauseRenderingUpdate();
      this.freezeAgents();

      await sleep(4000);

      this.metadata.reset();
      this.resetGrid();
      this.resetAgents();
      this.renderer.resumeRenderingUpdate();
      this.metadata.startClock();

      return;
    }

    const intangible = (object: GameObject) => object.variations.has("waiting");
    const hitsEnemy = target.some(object => object.type == "enemy" && !intangible(object));
    const hitsPlayer = target.some(object => object.type == "player") && !intangible(context.agent);

    if (
      context.agent.type == "player" && hitsEnemy ||
      context.agent.type == "enemy" && hitsPlayer
    ) {
      if (this.player.variations.has("promoted")) {
        for (const object of [...target, context.agent]) {
          if (object.type == "enemy") {
            const enemy = object as Enemy;
            this.grid.remove(enemy.row, enemy.column, enemy);
            this.metadata.score += 100;

            enemy.reset();
            enemy.variations.add(enemy.direction);
            this.wait(enemy, this.enemyWaiting);
          }
        }
      } else {
        this.metadata.lives--;
        if (this.metadata.lives == 0) {
          this.metadata.status = "Game Over";
        } else this.metadata.status = "Captured!";

        this.metadata.pauseClock();
        this.renderer.pauseRenderingUpdate();
        this.freezeAgents();

        await sleep(2000);

        if (this.metadata.lives == 0) {
          this.metadata.reset();
          this.resetGrid();
        }

        this.resetAgents();
        this.renderer.resumeRenderingUpdate();
        this.metadata.startClock();
      }
    }
  }

  private resetGrid(): void {
    this.grid.clear();
    this.player.reset();
    this.grid.add(this.player.row, this.player.column, this.player);
    this.maze.generate({ player: this.player });
  }

  private resetAgents(): void {
    for (const agent of this.agents) {
      this.grid.remove(agent.row, agent.column, agent);

      agent.reset();
      agent.variations.add(agent.direction);
      this.grid.add(agent.row, agent.column, agent);
      this.wait(agent, this.playerWaiting);
    }
  }

  private async playerTransformation(): Promise<void> {
    this.player.variations.add("transforming");
    this.player.variations.add("stopped");
    this.grid.update(this.player.row, this.player.column, this.player);

    await sleep(this.transformingDuration);

    this.player.variations.delete("transforming");
    this.grid.update(this.player.row, this.player.column, this.player);
  }

  private async wait(agent: Player | Enemy, ms: number): Promise<void> {
    agent.variations.add("waiting");
    agent.variations.add("stopped");
    this.grid.update(agent.row, agent.column, agent);

    await sleep(ms);

    agent.variations.delete("waiting");
    this.grid.update(agent.row, agent.column, agent);
  }

  private freezeAgents(): void {
    for (const agent of this.agents) {
      agent.variations.add("freeze");
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export {
  CollisionHandler
};
