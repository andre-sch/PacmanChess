import type { Grid } from "./grid";
import type { PlayerMovement, PlayerSubscriber } from "./player";

const container = document.querySelector("header") as HTMLElement;
const chronometer = document.querySelector("#chronometer span") as HTMLSpanElement;
const score = document.querySelector("#score") as HTMLSpanElement;

class GameMetadata implements PlayerSubscriber {
  private readonly grid: Grid;
  private seconds: number = 0;
  private score: number = 0;

  constructor(
    props: {
      grid: Grid;
      tileSize: number;
      gapSize: number;
    }
  ) {
    this.grid = props.grid;

    container.style.maxWidth =
      (this.grid.numberOfColumns * props.tileSize +
      (this.grid.numberOfColumns - 1) * props.gapSize) + "px";

    setInterval(() => {
      this.seconds++;

      const template = (this.seconds >= 3600 ? "hh:mm:ss" : "mm:ss")
        .replace("hh", this.formatUnit(this.seconds / 3600))
        .replace("mm", this.formatUnit((this.seconds % 3600) / 60))
        .replace("ss", this.formatUnit(this.seconds % 60));

      chronometer.textContent = template;
    }, 1000);
  }

  public update(context: PlayerMovement): void {
    const [nextRow, nextColumn] = context.nextPosition;
    const elements = this.grid.elements[nextRow][nextColumn];
    if (elements.length == 0) return;

    const dot = elements.find(object => object.type == "dot");
    if (dot) {
      this.score += 10;
    }

    const pellet = elements.find(object => object.type == "pellet");
    if (pellet) {
      this.score += 50;
    }

    score.textContent = "+" + this.score;
  }

  private formatUnit(value: number): string {
    return Math.floor(value).toString().padStart(2, "0");
  }
}

export {
  GameMetadata
};
