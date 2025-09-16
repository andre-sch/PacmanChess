import type { Grid } from "./grid";
import type { PlayerMovement, PlayerSubscriber } from "./player";

class CollisionHandler implements PlayerSubscriber {
  constructor(private grid: Grid) {}

  public update(movement: PlayerMovement): void {
    const [nextRow, nextColumn] = movement.nextPosition;
    const object = this.grid.elements[nextRow][nextColumn];
    if (object == null) return;

    if (object.type == "pellet") {
      movement.agent.score += 50;
      movement.agent.promoted = true;
      setTimeout(() => movement.agent.promoted = false, 8000);
    }

    if (object.type == "dot") {
      movement.agent.score += 10;
    }
  }
}

export {
  CollisionHandler
};
