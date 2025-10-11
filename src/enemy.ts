import { Grid } from "./grid";
import { GameObject } from "./gameObject";
import { Player } from "./player";
import { Direction } from "./direction";
import { AgentRenderer } from "./renderer";

interface GameContext {
  grid: Grid;
  player: Player;
  enemies: Map<string, Enemy>;
}

abstract class Enemy extends GameObject {
  protected movements: {
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
    public name: string,
    private startRow: number = 0,
    private startColumn: number = 0,
    private startDirection: Direction = Direction.RIGHT,
    protected context: GameContext
  ) {
    super("enemy");
    this.row = startRow;
    this.column = startColumn;
    this.direction = startDirection;
    this.variations.add(this.name);
  }

  public abstract nextDirection(): Direction;

  protected closestDirectionTo(targetRow: number, targetColumn: number): Direction {
    const path = this.BFS(targetRow, targetColumn);

    if (!path || path.length < 2) {
      return this.direction;
    } else {
      const nextStep = path[1];
      return nextStep.direction;
    }
  }

  private BFS(targetRow: number, targetColumn: number){
    const visited = new Set<number>();
    const queue: {
      path: {
        coordinates: [number, number];
        direction: Direction;
      }[]
    }[] = [];

    const encode = (row: number, column: number) => row * this.context.grid.numberOfColumns + column;

    const start: [number, number] = [this.row, this.column];
    queue.push({ path: [{ coordinates: start, direction: this.direction }] });
    visited.add(encode(...start));

    while (queue.length > 0) {
      const { path } = queue.shift()!;
      const [row, column] = path[path.length - 1].coordinates;

      if (row == targetRow && column == targetColumn) {
        return path;
      }

      let direction: keyof typeof this.movements;
      for (direction in this.movements) {
        const [deltaRow, deltaColumn] = this.movements[direction];

        const nextRow = row + deltaRow;
        const nextColumn = column + deltaColumn;

        if (
          this.context.grid.canTraverse(nextRow, nextColumn) &&
          !visited.has(encode(nextRow, nextColumn))
        ) {
          visited.add(encode(nextRow, nextColumn));

          queue.push({
            path: [...path, {
              coordinates: [nextRow, nextColumn],
              direction
            }]
          });
        }
      }
    }
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
    this.variations.add(this.name);
  }
}

class Blinky extends Enemy {
  private safeZoneSize: number = 5;
  private safePoint: [number, number] | undefined;

  constructor(context: GameContext) {
    super("blinky", ...context.grid.topRight, Direction.DOWN, context);
  }

  public nextDirection(): Direction {
    if (this.context.player.variations.has("promoted")) {
      if (
        !this.safePoint ||
        this.row == this.safePoint[0] &&
        this.column == this.safePoint[1]
      ) {
        const [top, right] = this.context.grid.topRight;
        do {
          this.safePoint = [
            Math.floor(Math.random() * this.safeZoneSize) + top,
            Math.floor(Math.random() * this.safeZoneSize) + right - this.safeZoneSize
          ];
        } while(!this.context.grid.canTraverse(...this.safePoint));
      }

      return this.closestDirectionTo(...this.safePoint);
    }

    return this.closestDirectionTo(this.context.player.row, this.context.player.column);
  }
}

class Inky extends Enemy {
  private safeZoneSize: number = 5;
  private safePoint: [number, number] | undefined;

  constructor(context: GameContext) {
    super("inky", ...context.grid.bottomRight, Direction.LEFT, context);
  }

  public nextDirection(): Direction {
    if (this.context.player.variations.has("promoted")) {
      if (
        !this.safePoint ||
        this.row == this.safePoint[0] &&
        this.column == this.safePoint[1]
      ) {
        const [bottom, right] = this.context.grid.bottomRight;
        do {
          this.safePoint = [
            Math.floor(Math.random() * this.safeZoneSize) + bottom - this.safeZoneSize,
            Math.floor(Math.random() * this.safeZoneSize) + right - this.safeZoneSize
          ];
        } while(!this.context.grid.canTraverse(...this.safePoint));
      }

      return this.closestDirectionTo(...this.safePoint);
    }

    const rowAheadOfTime = this.context.player.direction == Direction.UP
      ? this.context.player.row - 2
      : this.context.player.direction == Direction.DOWN
        ? this.context.player.row + 2
        : this.context.player.row;

    const columnAheadOfTime = this.context.player.direction == Direction.LEFT
      ? this.context.player.column - 2
      : this.context.player.direction == Direction.RIGHT
        ? this.context.player.column + 2
        : this.context.player.column;

    const blinky = this.context.enemies.get("blinky");
    if (!blinky) throw new Error("Inky position depends on Blinky position, and Blinky is absent");

    const [blinkyRow, blinkyColumn] = blinky.nextPosition();

    const vectorRow = rowAheadOfTime - blinkyRow;
    const vectorColumn = columnAheadOfTime - blinkyColumn;

    const targetRow = blinkyRow + 2 * vectorRow;
    const targetColumn = blinkyColumn + 2 * vectorColumn;

    const inBounds = (point: [number, number]): [number, number] => [
      Math.min(Math.max(point[0], 0), this.context.grid.numberOfRows - 1),
      Math.min(Math.max(point[0], 1), this.context.grid.numberOfColumns - 1)
    ];

    return this.closestDirectionTo(...inBounds([targetRow, targetColumn]));
  }
}

class Pinky extends Enemy {
  private safeZoneSize: number = 5;
  private safePoint: [number, number] | undefined;

  constructor(context: GameContext) {
    super("pinky", ...context.grid.topLeft, Direction.RIGHT, context);
  }

  public nextDirection(): Direction {
    if (this.context.player.variations.has("promoted")) {
      if (
        !this.safePoint ||
        this.row == this.safePoint[0] &&
        this.column == this.safePoint[1]
      ) {
        const [top, left] = this.context.grid.topLeft;
        do {
          this.safePoint = [
            Math.floor(Math.random() * this.safeZoneSize) + top,
            Math.floor(Math.random() * this.safeZoneSize) + left
          ];
        } while(!this.context.grid.canTraverse(...this.safePoint));
      }

      return this.closestDirectionTo(...this.safePoint);
    }

    const rowAheadOfTime = this.context.player.direction == Direction.UP
      ? Math.max(this.context.player.row - 4, 0)
      : this.context.player.direction == Direction.DOWN
        ? Math.min(this.context.player.row + 4, this.context.grid.numberOfRows - 1)
        : this.context.player.row;

    const columnAheadOfTime = this.context.player.direction == Direction.LEFT
      ? Math.max(this.context.player.column - 4, 0)
      : this.context.player.direction == Direction.RIGHT
        ? Math.min(this.context.player.column + 4, this.context.grid.numberOfColumns - 1)
        : this.context.player.column;

    return this.closestDirectionTo(rowAheadOfTime, columnAheadOfTime);
  }
}

class Clyde extends Enemy {
  private safeZoneSize: number = 5;
  private safePoint: [number, number] | undefined;

  constructor(context: GameContext) {
    super("clyde", ...context.grid.bottomLeft, Direction.UP, context);
  }

  public nextDirection(): Direction {
    if (this.context.player.variations.has("promoted")) {
      if (
        !this.safePoint ||
        this.row == this.safePoint[0] &&
        this.column == this.safePoint[1]
      ) {
        const [bottom, left] = this.context.grid.bottomLeft;
        do {
          this.safePoint = [
            Math.floor(Math.random() * this.safeZoneSize) + bottom - this.safeZoneSize,
            Math.floor(Math.random() * this.safeZoneSize) + left
          ];
        } while(!this.context.grid.canTraverse(...this.safePoint));
      }

      return this.closestDirectionTo(...this.safePoint);
    }

    const playerDistance = Math.sqrt(
      Math.pow(this.row - this.context.player.row, 2) +
      Math.pow(this.column - this.context.player.column, 2)
    );

    if (playerDistance <= 8) {
      const directions = Object.values(Direction);
      let randomDirection: Direction;
      let randomRow, randomColumn: number;
      do {
        randomDirection = directions[Math.floor(Math.random() * directions.length)];
        const [rowDelta, columnDelta] = this.movements[randomDirection];

        randomRow = this.row + rowDelta;
        randomColumn = this.column + columnDelta;
      } while (!this.context.grid.canTraverse(randomRow, randomColumn));

      return randomDirection;
    } else return this.closestDirectionTo(this.context.player.row, this.context.player.column);
  }
}

class EnemyRenderer extends AgentRenderer {
  private interval: number;
  private timeout: number;

  constructor(
    private enemy: Enemy,
    private grid: Grid
  ) {
    super();
    const delay = 100;
    const duration = 600;
    this.timeout = delay + duration;

    const css = document.styleSheets[0];
    css.insertRule(`.enemy::after {
      animation-duration: ${duration}ms;
      animation-delay: ${delay}ms;
    }`);
  }

  public renderingTimeout(): number {
    return this.timeout;
  }

  public render() {
    this.enemy.variations.add(this.enemy.direction);
    this.grid.add(this.enemy.row, this.enemy.column, this.enemy);
  }

  public pauseRenderingUpdate() {
    clearInterval(this.interval);
  }

  public resumeRenderingUpdate() {
    this.interval = setInterval(this.updateRendering, this.timeout);
  }

  public updateRendering() {
    const transitions = ["freeze", "waiting"];
    if (transitions.some(variation => this.enemy.variations.has(variation))) return;

    this.grid.remove(this.enemy.row, this.enemy.column, this.enemy);

    const previousDirectionKey = Array.from(this.enemy.variations).toString().match(/up|down|left|right/)![0];
    const previousDirection = Direction[previousDirectionKey.toUpperCase() as keyof typeof Direction];

    if (
      !this.enemy.variations.has("stopped") &&
      this.grid.canTraverse(...this.enemy.nextPosition())
    ) {
      this.enemy.move();
    }

    this.enemy.direction = this.enemy.nextDirection();
    if (this.grid.canTraverse(...this.enemy.nextPosition())) {
      this.enemy.variations.delete("stopped");
      this.enemy.variations.delete(previousDirection);
      this.enemy.variations.add(this.enemy.direction);
    } else {
      this.enemy.direction = previousDirection;
      if (this.grid.canTraverse(...this.enemy.nextPosition())) {
        this.enemy.variations.delete("stopped");
      } else this.enemy.variations.add("stopped");

      this.enemy.direction = this.enemy.nextDirection();
    }

    this.grid.add(this.enemy.row, this.enemy.column, this.enemy);
  }
}

export {
  EnemyRenderer,
  Enemy,
  Blinky,
  Inky,
  Pinky,
  Clyde
};
