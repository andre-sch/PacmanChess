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
  private animationTimeout: number;

  constructor(
    private readonly player: Player,
    private readonly grid: Grid
  ) {
    const animationDelay = 0.15;
    const animationDuration = 0.6;
    this.animationTimeout = (animationDelay + animationDuration) * 1000;

    const css = document.styleSheets[0];
    css.insertRule(`.player::after {
      animation-duration: ${animationDuration}s;
      animation-delay: ${animationDelay}s;
    }`);
  }

  public render() {
    this.player.variations.push(this.player.direction);
    this.grid.update(this.player.row, this.player.column, this.player);

    const getDirectionOf = (key: string) => Direction[key.toUpperCase() as keyof typeof Direction];

    setInterval(() => {
      this.grid.remove(this.player.row, this.player.column);

      const previousDirection = getDirectionOf(this.player.variations[0]);
      const nextDirection = getDirectionOf(this.player.direction);

      this.player.direction = previousDirection;
      this.player.move();

      this.player.direction = nextDirection;
      this.player.variations = [nextDirection];

      this.grid.update(this.player.row, this.player.column, this.player);
    }, this.animationTimeout);
  }
}

export {
  Player,
  PlayerController,
  PlayerRenderer
};
