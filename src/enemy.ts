import { Grid } from "./grid";
import { GameObject } from "./gameObject";
import { Player } from "./player";
import { Direction } from "./direction";
import type { AgentEventPublisher } from "./agent";

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
  private eventPublisher?: AgentEventPublisher;

  constructor(
    public name: string,
    private startRow: number = 0,
    private startColumn: number = 0,
    private startDirection: Direction = Direction.RIGHT,
    protected context: GameContext,
    options?: { eventPublisher: AgentEventPublisher }
  ) {
    super("enemy");
    this.row = startRow;
    this.column = startColumn;
    this.direction = startDirection;
    this.eventPublisher = options?.eventPublisher;
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
    this.variations.add(this.name);
  }
}

class Blinky extends Enemy {
  private safeZoneSize: number = 5;
  private safePoint: [number, number] | undefined;

  constructor(context: GameContext, options?: { eventPublisher: AgentEventPublisher }) {
    super("blinky", ...context.grid.topRight, Direction.DOWN, context, options);
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

  constructor(context: GameContext, options?: { eventPublisher: AgentEventPublisher }) {
    super("inky", ...context.grid.bottomRight, Direction.LEFT, context, options);
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

  constructor(context: GameContext, options?: { eventPublisher: AgentEventPublisher }) {
    super("pinky", ...context.grid.topLeft, Direction.RIGHT, context, options);
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

  constructor(context: GameContext, options?: { eventPublisher: AgentEventPublisher }) {
    super("clyde", ...context.grid.bottomLeft, Direction.UP, context, options);
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

class EnemyRenderer {
  private animationTimeout: number;

  constructor(private grid: Grid) {
    const animationDelay = 0.1;
    const animationDuration = 0.6;
    this.animationTimeout = (animationDelay + animationDuration) * 1000;

    const css = document.styleSheets[0];
    css.insertRule(`.enemy::after {
      animation-duration: ${animationDuration}s;
      animation-delay: ${animationDelay}s;
    }`);
  }

  public render(...enemies: Enemy[]) {
    enemies.forEach(enemy => {
      enemy.variations.add(enemy.direction);
      this.grid.add(enemy.row, enemy.column, enemy);

      setInterval(() => {
        if (enemy.variations.has("waiting")) return;
        this.grid.remove(enemy.row, enemy.column, enemy);

        const previousDirectionKey = Array.from(enemy.variations).toString().match(/up|down|left|right/)![0];
        const previousDirection = Direction[previousDirectionKey.toUpperCase() as keyof typeof Direction];

        if (
          !enemy.variations.has("stopped") &&
          this.grid.canTraverse(...enemy.nextPosition())
        ) {
          enemy.move();
        }

        enemy.direction = enemy.nextDirection();
        if (this.grid.canTraverse(...enemy.nextPosition())) {
          enemy.variations.delete("stopped");
          enemy.variations.delete(previousDirection);
          enemy.variations.add(enemy.direction);
        } else {
          enemy.direction = previousDirection;
          if (this.grid.canTraverse(...enemy.nextPosition())) {
            enemy.variations.delete("stopped");
          } else enemy.variations.add("stopped");

          enemy.direction = enemy.nextDirection();
        }

        this.grid.add(enemy.row, enemy.column, enemy);
      }, this.animationTimeout);
    });
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
