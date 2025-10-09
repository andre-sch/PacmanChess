import type { Grid } from "./grid";
import type { Maze } from "./maze";
import type { GameMetadata } from "./metadata";
import type { AgentMovement, AgentSubscriber } from "./agent";
import type { Player } from "./player";
import type { Enemy } from "./enemy";

class CollisionHandler implements AgentSubscriber {
  private readonly grid: Grid;
  private readonly maze: Maze;
  private readonly player: Player;
  private readonly enemies: Enemy[];
  private readonly metadata: GameMetadata;
  private readonly transformingDuration: number;
  private readonly promotionDuration: number;
  private readonly playerSleepDuration: number;
  private readonly enemySleepDuration: number;
  private lastPromotion?: number;

  constructor(
    props: {
      grid: Grid;
      maze: Maze;
      player: Player;
      enemies: Enemy[];
      metadata: GameMetadata;
      transformingDuration?: number;
      promotionDuration?: number;
      playerSleepDuration?: number;
      enemySleepDuration?: number;
    }
  ) {
    this.grid = props.grid;
    this.maze = props.maze;
    this.player = props.player;
    this.enemies = props.enemies;
    this.metadata = props.metadata;
    this.transformingDuration = props.transformingDuration ?? 500;
    this.promotionDuration = props.promotionDuration ?? 8000;
    this.playerSleepDuration = props.playerSleepDuration ?? 4000;
    this.enemySleepDuration = props.enemySleepDuration ?? 5000;

    const css = document.styleSheets[0];
    css.insertRule(`.player.transforming::after {
      animation-duration: ${this.transformingDuration}ms !important;
    }`);

    for (const agent of [this.player, ...this.enemies]) {
      this.sleepAgent(agent, this.playerSleepDuration);
    }
  }

  public update(context: AgentMovement): void {
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

    const hitsEnemy = target.some(object => object.type == "enemy");
    const hitsPlayer = target.some(object => object.type == "player");

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
            this.sleepAgent(enemy, this.enemySleepDuration);
          }
        }
      } else {
        this.metadata.lives--;
        if (this.metadata.lives == 0) {
          this.metadata.status = "Game Over";
        } else this.metadata.status = "Captured!";

        afterPaint(() => {
          this.metadata.pauseClock();
          sleepSync(1500);

          if (this.metadata.lives == 0) {
            this.metadata.lives = this.metadata.maxLives;

            this.grid.clear();
            this.player.reset();
            this.grid.add(this.player.row, this.player.column, this.player);
            this.maze.generate({ player: this.player });
          }

          for (const agent of [this.player, ...this.enemies]) {
            this.grid.remove(agent.row, agent.column, agent);

            agent.reset();
            agent.variations.add(agent.direction);
            this.grid.add(agent.row, agent.column, agent);
            this.sleepAgent(agent, this.playerSleepDuration);
          }

          this.metadata.startClock();
        });
      }
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

  private async sleepAgent(agent: Player | Enemy, ms: number): Promise<void> {
    agent.variations.add("waiting");
    agent.variations.add("stopped");
    this.grid.update(agent.row, agent.column, agent);

    await sleep(ms);

    agent.variations.delete("waiting");
    this.grid.update(agent.row, agent.column, agent);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function sleepSync(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end);
};

function afterPaint(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

export {
  CollisionHandler
};
