import { GameObject } from "./gameObject";
import { Grid } from "./grid";
import { Player } from "./player";

class Hole extends GameObject {
  constructor(
    public row: number,
    public column: number,
  ) {
    super("hole");
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
  private holes: SetOfPoints;
  private minHole: number;
  private maxHole: number;

  constructor(
    grid: Grid,
    options?: { minHole: number, maxHole: number }
  ) {
    this.grid = grid;
    this.minHole = options?.minHole || 2;
    this.maxHole = options?.maxHole || 5;
  }

  public generate(props: { player: Player }): void {
    this.grid.add(...props.player.nextPosition(), new Dot());

    this.generateHoles();
    this.generateDots({ player: props.player });
  }

  private async generateHoles(): Promise<void> {
    this.holes = new SetOfPoints({ grid: this.grid });

    while (true) {
      const startPoints = this.eligibleStartPoints();
      if (startPoints.length == 0) break;

      let index = Math.floor(Math.random() * startPoints.length);
      let firstPoint = startPoints.splice(index, 1)[0];
      let column = firstPoint.column;
      let row = firstPoint.row;

      const groupOfHoles = [new Hole(row, column)];

      const holeSize = Math.floor(Math.random() * (this.maxHole - this.minHole + 1)) + this.minHole;

      while (groupOfHoles.length < holeSize) {
        const holeOptions = [...groupOfHoles];

        let neighbor: GameObject | undefined | null = null;
        do {
          index = Math.floor(Math.random() * holeOptions.length);
          const hole = holeOptions.splice(index, 1)[0];

          const emptyPoints = this.orthogonalNeighborsOf(hole.row, hole.column)
            .filter(neighbor => this.eligiblePoint(neighbor.row, neighbor.column));

          if (emptyPoints.length > 0) {
            index = Math.floor(Math.random() * emptyPoints.length);
            const point = emptyPoints.splice(index, 1)[0];

            row = point.row;
            column = point.column;
            neighbor = this.grid.elements[row][column][0];
          }
        } while (neighbor != undefined && holeOptions.length > 0);

        if (neighbor != undefined) break;
        groupOfHoles.push(new Hole(row, column));
      }

      for (const hole of groupOfHoles) {
        this.holes.add(hole.row, hole.column);
        this.grid.add(hole.row, hole.column, hole);
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

    const numberOfPellets = Math.min(7, Math.floor(coordinatesOfDots.length / 45));
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
        !this.holes.has(neighbor.row, neighbor.column))
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
  private holes: Map<number, Point> = new Map();

  constructor(props: { grid: Grid }) {
    this.grid = props.grid;
  }

  public has(row: number, column: number): boolean {
    return this.holes.has(this.encode(row, column));
  }

  public get(row: number, column: number): [number, number] | undefined {
    const point = this.holes.get(this.encode(row, column));
    return point ? [point.row, point.column] : undefined;
  }

  public add(row: number, column: number): void {
    this.holes.set(this.encode(row, column), { row, column });
  }

  private encode(row: number, column: number): number {
    return row * this.grid.numberOfColumns + column;
  }
}

export { Maze };
