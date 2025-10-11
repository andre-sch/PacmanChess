import { Grid } from "./grid";
import { GameObject } from "./gameObject";
import { Direction } from "./direction";
import { AgentRenderer } from "./renderer";
import { css } from "./styles";

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

  constructor(
    private startRow: number = 0,
    private startColumn: number = 0,
    private startDirection: Direction = Direction.RIGHT
  ) {
    super("player");
    this.row = startRow;
    this.column = startColumn;
    this.direction = startDirection;
  }

  public nextPosition(): [number, number] {
    const [rowDelta, columnDelta] = this.movements[this.direction];
    return [this.row + rowDelta, this.column + columnDelta];
  }

  public move(): void {
    const [nextRow, nextColumn] = this.nextPosition();

    this.row = nextRow;
    this.column = nextColumn;
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

type Subscriber = () => void;

class PlayerRenderer extends AgentRenderer {
  private iterations: number;
  private interval: number;
  private timeout: number;

  constructor(
    private readonly player: Player,
    private readonly grid: Grid,
    private readonly subscribers: Subscriber[] = []
  ) {
    super();
    const animationDelay = 100;
    const animationDuration = 600;
    const animationTimeout = animationDelay + animationDuration;

    const promotionSpeedRatio = 5;
    this.iterations = promotionSpeedRatio;
    this.timeout = animationTimeout / this.iterations;

    css.insertRule(`.player::after {
      animation-duration: ${animationDuration}ms;
      animation-delay: ${animationDelay}ms;
    }`);

    css.insertRule(`.player.promoted::after {
      animation-duration: ${animationTimeout / this.iterations}ms;
      animation-delay: 0ms;
    }`);
  }

  public attachSubscriber(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }

  private notifySubscribers() {
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }

  public renderingTimeout(): number {
    if (this.player.variations.has("promoted")) {
      return this.timeout;
    } else {
      return this.timeout * this.iterations;
    }
  }

  public minRenderingTimeout(): number {
    return this.timeout;
  }

  public render() {
    this.player.variations.add(this.player.direction);
    this.grid.add(this.player.row, this.player.column, this.player);
  }

  public pauseRenderingUpdate() {
    clearInterval(this.interval);
  }

  public resumeRenderingUpdate(): void {
    let time = 0;
    this.interval = setInterval(() => {
      if (time % this.renderingTimeout() == 0) {
        this.updateRendering();
      }

      time += this.timeout;
    }, this.timeout);
  }

  public updateRendering() {
    const transitions = ["freeze", "waiting", "transforming"];
    if (transitions.some(variation => this.player.variations.has(variation))) return;

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
    this.notifySubscribers();
  }
}

export {
  Player,
  PlayerController,
  PlayerRenderer
};
