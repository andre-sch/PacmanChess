import { Grid } from "./grid";
import { GameObject } from "./gameObject";
import { Direction } from "./direction";
import type { AgentEventPublisher } from "./agent";

class Player extends GameObject {
  private movements: {
    [Key in Direction]: [number, number];
  } = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1]
  }

  public row: number;
  public column: number;
  public direction: Direction;
  public eventPublisher?: AgentEventPublisher;

  constructor(
    private startRow: number = 0,
    private startColumn: number = 0,
    private startDirection: Direction = Direction.RIGHT,
    options?: { eventPublisher: AgentEventPublisher }
  ) {
    super("player");
    this.row = startRow;
    this.column = startColumn;
    this.direction = startDirection;
    this.eventPublisher = options?.eventPublisher;
  }

  public nextPosition(): [number, number] {
    const [rowDelta, columnDelta] = this.movements[this.direction];
    return [this.row + rowDelta, this.column + columnDelta];
  }

  public move(): void {
    const previousPosition: [number, number] = [this.row, this.column];
    const nextPosition = this.nextPosition();

    const [nextRow, nextColumn] = nextPosition;
    this.row = nextRow;
    this.column = nextColumn;

    this.eventPublisher?.publishUpdate({
      agent: this,
      previousPosition,
      nextPosition
    });
  }

  public reset(): void {
    this.row = this.startRow;
    this.column = this.startColumn;
    this.direction = this.startDirection;
    this.variations.clear();
  }
}

class PlayerController {
  private keyboardDirections: {
    [Key: string]: Direction | undefined;
  } = {
    "ArrowUp": Direction.UP,
    "ArrowDown": Direction.DOWN,
    "ArrowLeft": Direction.LEFT,
    "ArrowRight": Direction.RIGHT
  }

  constructor(private player: Player) {}

  public bindKeyboard(): void {
    document.addEventListener("keydown", (event) => {
      const direction = this.keyboardDirections[event.key];
      if (direction) this.player.direction = direction;
    });
  }
}

class PlayerRenderer {
  private animationTimeout: number;
  private promotionSpeedRatio = 5;

  constructor(
    private readonly player: Player,
    private readonly grid: Grid
  ) {
    const animationDelay = 0.1;
    const animationDuration = 0.6;
    this.animationTimeout = (animationDelay + animationDuration) * 1000;

    const css = document.styleSheets[0];
    css.insertRule(`.player::after {
      animation-duration: ${animationDuration}s;
      animation-delay: ${animationDelay}s;
    }`);

    css.insertRule(`.player.promoted::after {
      animation-duration: ${(animationDuration + animationDelay) / this.promotionSpeedRatio}s;
      animation-delay: 0s;
    }`);
  }

  public render() {
    this.player.variations.add(this.player.direction);
    this.grid.add(this.player.row, this.player.column, this.player);

    let count = 0;
    const iterations = this.promotionSpeedRatio;

    setInterval(() => {
      count++;
      if (this.player.variations.has("promoted") || count % iterations == 1) {
        if (this.player.variations.has("waiting") || this.player.variations.has("transforming")) return;
        this.grid.remove(this.player.row, this.player.column, this.player);

        const previousDirectionKey = Array.from(this.player.variations).toString().match(/up|down|left|right/)![0];
        const previousDirection = Direction[previousDirectionKey.toUpperCase() as keyof typeof Direction];
        const nextDirection = this.player.direction;

        this.player.direction = previousDirection;
        if (
          !this.player.variations.has("stopped") &&
          this.grid.canTraverse(...this.player.nextPosition())
        ) {
          this.player.move();
        }

        this.player.direction = nextDirection;
        if (this.grid.canTraverse(...this.player.nextPosition())) {
          this.player.variations.delete("stopped");
          this.player.variations.delete(previousDirection);
          this.player.variations.add(nextDirection);
        } else {
          this.player.direction = previousDirection;
          if (this.grid.canTraverse(...this.player.nextPosition())) {
            this.player.variations.delete("stopped");
          } else this.player.variations.add("stopped");

          this.player.direction = nextDirection;
        }

        this.grid.add(this.player.row, this.player.column, this.player);
      }
    }, this.animationTimeout / iterations);
  }
}

export {
  Player,
  PlayerController,
  PlayerRenderer
};
