import type { Grid } from "./grid";
import type { GameMetadata } from "./metadata";
import type { AgentMovement, AgentSubscriber } from "./agent";
import type { Player } from "./player";
import type { Enemy } from "./enemy";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CollisionHandler implements AgentSubscriber {
  private readonly grid: Grid;
  private readonly player: Player;
  private readonly enemies: Enemy[];
  private readonly metadata: GameMetadata;
  private readonly transformingDuration: number;
  private readonly promotionDuration: number;
  private lastPromotion?: number;

  constructor(
    props: {
      grid: Grid;
      player: Player;
      enemies: Enemy[];
      metadata: GameMetadata;
      transformingDuration?: number;
      promotionDuration?: number;
    }
  ) {
    this.grid = props.grid;
    this.player = props.player;
    this.enemies = props.enemies;
    this.metadata = props.metadata;
    this.transformingDuration = props.transformingDuration ?? 0.5;
    this.promotionDuration = props.promotionDuration ?? 8;

    const css = document.styleSheets[0];
    css.insertRule(`.player.transforming::after {
      animation-duration: ${this.transformingDuration}s !important;
    }`);
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
        }, this.promotionDuration * 1000);
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
      this.metadata.lives--;
      if (this.metadata.lives == 0) {
        alert("Game ends");
      }

      for (const agent of [this.player, ...this.enemies]) {
        this.grid.remove(agent.row, agent.column, agent);

        agent.reset();
        this.grid.add(agent.row, agent.column, agent);
      }
    }
  }

  private async playerTransformation(): Promise<void> {
    this.player.variations.add("transforming");
    this.player.variations.add("stopped");
    this.grid.update(this.player.row, this.player.column, this.player);

    await sleep(this.transformingDuration * 1000);

    this.player.variations.delete("transforming");
    this.grid.update(this.player.row, this.player.column, this.player);
  }
}

export {
  CollisionHandler
};
