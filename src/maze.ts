import { GameObject } from "./gameObject";
import { Grid } from "./grid";
import { Player } from "./player";

class Obstacle extends GameObject {
  constructor(
    public row: number,
    public column: number,
  ) {
    super("obstacle");
    this.traversable = false;
  }
}

class Dot extends GameObject {
  constructor() {
    super("dot");
  }
}

class Pellet extends GameObject {
  constructor() {
    super("pellet");
  }
}

class Maze {
  private grid: Grid;
  private obstacles: SetOfPoints;
  private minObstacle: number;
  private maxObstacle: number;

  constructor(
    grid: Grid,
    options?: { minObstacle: number, maxObstacle: number }
  ) {
    this.grid = grid;
    this.minObstacle = options?.minObstacle || 2;
    this.maxObstacle = options?.maxObstacle || 5;
  }

  public generate(props: { player: Player }): void {
    this.grid.add(...props.player.nextPosition(), new Dot());

    this.generateObstacles();
    this.generateDots({ player: props.player });
  }

  private async generateObstacles(): Promise<void> {
    this.obstacles = new SetOfPoints({ grid: this.grid });

    while (true) {
      const startPoints = this.eligibleStartPoints();
      if (startPoints.length == 0) break;

      let index = Math.floor(Math.random() * startPoints.length);
      let firstPoint = startPoints.splice(index, 1)[0];
      let column = firstPoint.column;
      let row = firstPoint.row;

      const groupOfObstacles = [new Obstacle(row, column)];
      const obstacleLength = Math.floor(Math.random() * (this.maxObstacle - this.minObstacle + 1)) + this.minObstacle;

      while (groupOfObstacles.length < obstacleLength) {
        const availableObstacles = [...groupOfObstacles];

        let neighbor: GameObject | undefined | null = null;
        do {
          index = Math.floor(Math.random() * availableObstacles.length);
          const obstacle = availableObstacles.splice(index, 1)[0];

          const emptyPoints = this.orthogonalNeighborsOf(obstacle.row, obstacle.column)
            .filter(neighbor => this.eligiblePoint(neighbor.row, neighbor.column));

          if (emptyPoints.length > 0) {
            index = Math.floor(Math.random() * emptyPoints.length);
            const point = emptyPoints.splice(index, 1)[0];

            row = point.row;
            column = point.column;
            neighbor = this.grid.elements[row][column][0];
          }
        } while (neighbor != undefined && availableObstacles.length > 0);

        if (neighbor != undefined) break;
        groupOfObstacles.push(new Obstacle(row, column));
      }

      for (const obstacle of groupOfObstacles) {
        this.obstacles.add(obstacle.row, obstacle.column);
        this.grid.add(obstacle.row, obstacle.column, obstacle);
      }
    }
  }

  private generateDots(props: { player: Player }): void {
    const [nextRow, nextColumn] = props.player.nextPosition();
    const coordinatesOfDots: [number, number][] = [];
    for (let row = 0; row < this.grid.numberOfRows; row++) {
      for (let column = 0; column < this.grid.numberOfColumns; column++) {
        if (
          row == props.player.row && column == props.player.column ||
          row == nextRow && column == nextColumn
        ) continue;

        if (this.grid.canTraverse(row, column)) {
          this.grid.add(row, column, new Dot());
          coordinatesOfDots.push([row, column]);
        }
      }
    }

    const numberOfPellets = Math.min(5, Math.floor(coordinatesOfDots.length / 45));
    const range = Math.floor(coordinatesOfDots.length / (numberOfPellets + 1));

    for (let i = 0; i < numberOfPellets; i++) {
      const [row, column] = coordinatesOfDots[(i+1) * range];

      const dot = this.grid.elements[row][column][0];
      this.grid.remove(row, column, dot);

      this.grid.add(row, column, new Pellet());
    }
  }

  private eligibleStartPoints() {
    const startPoints: Point[] = [];

    for (let row = 0; row < this.grid.numberOfRows; row++) {
      for (let column = 0; column < this.grid.numberOfColumns; column++) {
        if (this.eligiblePoint(row, column)) {
          startPoints.push({ row, column });
        }
      }
    }

    return startPoints;
  }

  private eligiblePoint(row: number, column: number) {
    return (
      !this.grid.onEdge(row, column) &&
      this.grid.elements[row][column].length == 0 &&
      this.neighborsOf(row, column).every(neighbor =>
        !this.obstacles.has(neighbor.row, neighbor.column))
    );
  }

  private neighborsOf(row: number, column: number) {
    return [
      ...this.orthogonalNeighborsOf(row, column),
      ...this.diagonalNeighborsOf(row, column)
    ];
  }

  private orthogonalNeighborsOf(row: number, column: number) {
    const neighbors: Point[] = [];
    const orthogonal = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [rowDelta, columnDelta] of orthogonal) {
      const neighborRow = row + rowDelta;
      const neighborColumn = column + columnDelta;

      if (this.grid.inBounds(neighborRow, neighborColumn)) {
        neighbors.push({ row: neighborRow, column: neighborColumn });
      }
    }

    return neighbors;
  }

  private diagonalNeighborsOf(row: number, column: number) {
    const neighbors: Point[] = [];
    const diagonal = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [rowDelta, columnDelta] of diagonal) {
      const neighborRow = row + rowDelta;
      const neighborColumn = column + columnDelta;

      if (this.grid.inBounds(neighborRow, neighborColumn)) {
        neighbors.push({ row: neighborRow, column: neighborColumn });
      }
    }

    return neighbors;
  }
}

type Point = { row: number, column: number };

class SetOfPoints {
  private grid: Grid;
  private points: Map<number, Point> = new Map();

  constructor(props: { grid: Grid }) {
    this.grid = props.grid;
  }

  public has(row: number, column: number): boolean {
    return this.points.has(this.encode(row, column));
  }

  public get(row: number, column: number): [number, number] | undefined {
    const point = this.points.get(this.encode(row, column));
    return point ? [point.row, point.column] : undefined;
  }

  public add(row: number, column: number): void {
    this.points.set(this.encode(row, column), { row, column });
  }

  private encode(row: number, column: number): number {
    return row * this.grid.numberOfColumns + column;
  }
}

export { Maze };
