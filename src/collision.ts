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

  public async update(context: PlayerMovement): Promise<void> {
    const [nextRow, nextColumn] = context.nextPosition;
    const elements = this.grid.elements[nextRow][nextColumn];
    if (elements.length == 0) return;

    const pellet = elements.find(object => object.type == "pellet");
    if (pellet) {
      context.agent.score += 50;
      context.agent.variations.add("promoted");
      this.grid.remove(nextRow, nextColumn, pellet);
      this.transform(context.agent);

      clearTimeout(this.lastPromotion);
      this.lastPromotion = setTimeout(() => {
        context.agent.variations.delete("promoted");
        this.transform(context.agent);
      }, this.promotionDuration * 1000);
    }

    const dot = elements.find(object => object.type == "dot");
    if (dot) {
      context.agent.score += 10;
      this.grid.remove(nextRow, nextColumn, dot);
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
