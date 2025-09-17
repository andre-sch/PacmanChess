import type { Grid } from "./grid";
import type { PlayerMovement, PlayerSubscriber } from "./player";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CollisionHandler implements PlayerSubscriber {
  private readonly transformingDuration: number;
  private readonly promotionDuration: number;
  private lastPromotion?: number;

  constructor(
    private grid: Grid,
    options?: {
      transformingDuration?: number;
      promotionDuration?: number;
    }
  ) {
    this.transformingDuration = options?.transformingDuration ?? 0.5;
    this.promotionDuration = options?.promotionDuration ?? 8;

    const css = document.styleSheets[0];
    css.insertRule(`.player.transforming::after {
      animation-duration: ${this.transformingDuration}s !important;
    }`);
  }

  public async update(movement: PlayerMovement): Promise<void> {
    const [nextRow, nextColumn] = movement.nextPosition;
    const object = this.grid.elements[nextRow][nextColumn];
    if (object == null) return;

    if (object.type == "pellet") {
      movement.agent.score += 50;
      movement.agent.variations.add("promoted");
      this.transform(movement.agent);

      clearTimeout(this.lastPromotion);
      this.lastPromotion = setTimeout(() => {
        movement.agent.variations.delete("promoted");
        this.transform(movement.agent);
      }, this.promotionDuration * 1000);
    }

    if (object.type == "dot") {
      movement.agent.score += 10;
    }
  }

  private async transform(agent: any): Promise<void> {
    agent.variations.add("transforming");
    this.grid.update(agent.row, agent.column, agent);

    await sleep(this.transformingDuration * 1000);

    agent.variations.delete("transforming");
    this.grid.update(agent.row, agent.column, agent);
  }
}

export {
  CollisionHandler
};
