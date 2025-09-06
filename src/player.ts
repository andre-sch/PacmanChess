import { GameObject } from "./gameObject";
import type { Grid } from "./grid";

enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right"
}

class Player extends GameObject {
  private movements: {
    [Key in Direction]: [number, number];
  } = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1]
  }

  constructor(
    public row: number = 0,
    public column: number = 0,
    public direction: Direction = Direction.RIGHT
  ) {
    super("player");
  }

  public move(): void {
    const [rowDelta, columnDelta] = this.movements[this.direction];
    this.row += rowDelta;
    this.column += columnDelta;
  }
}

type Action = (player: Player) => void;

class PlayerController {
  private controls: {
    [Key: string]: Action | undefined;
  } = {
    "ArrowUp": (player: Player) => player.direction = Direction.UP,
    "ArrowDown": (player: Player) => player.direction = Direction.DOWN,
    "ArrowLeft": (player: Player) => player.direction = Direction.LEFT,
    "ArrowRight": (player: Player) => player.direction = Direction.RIGHT,
  }

  constructor(private player: Player) {}

  public bindKeyboard(): void {
    document.addEventListener("keydown", (event) => {
      const executeAction = this.controls[event.key];
      if (executeAction) {
        executeAction(this.player);
      }
    });
  }
}

class PlayerRenderer {
  constructor(
    private readonly player: Player,
    private readonly grid: Grid
  ) {}

  public render() {
    this.grid.update(this.player.row, this.player.column, this.player);

    setInterval(() => {
      this.grid.remove(this.player.row, this.player.column);

      this.player.move();
      this.grid.update(this.player.row, this.player.column, this.player);
    }, 500);
  }
}

export {
  Player,
  PlayerController,
  PlayerRenderer
};
