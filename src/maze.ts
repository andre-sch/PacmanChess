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
  private numberOfHoles: number;
  private holes: SetOfHoles;
  private minHole: number;
  private maxHole: number;

  constructor(
    grid: Grid,
    options?: {
      minHole: number,
      maxHole: number,
    }
  ) {
    this.grid = grid;
    this.holes = new SetOfHoles({ grid });

    this.minHole = options?.minHole || 2;
    this.maxHole = options?.maxHole || 5;

    const averageHole = (this.minHole + this.maxHole) / 2;
    const numberOfCells = grid.numberOfRows * grid.numberOfColumns;
    this.numberOfHoles = Math.ceil((0.3 * numberOfCells) / averageHole);
  }

  public generate(props: { player: Player }): void {
    this.grid.add(...props.player.nextPosition(), new Dot());

    this.generateHoles();
    this.generateDots({ player: props.player });
  }

  private generateHoles(): void {
    for (let i = 0; i < this.numberOfHoles; i++) {
      let row, column: number;

      do {
        row = Math.floor(Math.random() * (this.grid.numberOfRows - 2)) + 1;
        column = Math.floor(Math.random() * (this.grid.numberOfColumns - 2)) + 1;
      } while (!this.eligibleNeighbor(row, column));

      const groupOfHoles = [new Hole(row, column)];

      const holeSize = Math.floor(Math.random() * (this.maxHole - this.minHole + 1)) + this.minHole;

      while (groupOfHoles.length < holeSize) {
        const holeOptions = [...groupOfHoles];

        let neighbor: GameObject | undefined | null = null;
        do {
          let index = Math.floor(Math.random() * holeOptions.length);
          const hole = holeOptions.splice(index, 1)[0];

          const emptyPoints = this.orthogonalNeighborsOf(hole.row, hole.column)
            .filter(neighbor => this.eligibleNeighbor(neighbor.row, neighbor.column));

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

  private eligibleNeighbor(row: number, column: number) {
    return (
      this.grid.elements[row][column].length == 0 &&
      !this.grid.onEdge(row, column) &&
      this.neighborsOf(row, column).every(adjacent =>
        !this.holes.has(adjacent.row, adjacent.column))
    );
  }

  private neighborsOf(row: number, column: number) {
    const neighbors: { row: number; column: number; }[] = [...this.orthogonalNeighborsOf(row, column)];
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

  private orthogonalNeighborsOf(row: number, column: number) {
    const neighbors: { row: number; column: number; }[] = [];
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
}

class SetOfHoles {
  private grid: Grid;
  private holes: Map<number, [number, number]> = new Map();

  constructor(props: { grid: Grid }) {
    this.grid = props.grid;
  }

  public has(row: number, column: number): boolean {
    return this.holes.has(this.encode(row, column));
  }

  public get(row: number, column: number): [number, number] | undefined {
    return this.holes.get(this.encode(row, column));
  }

  public add(row: number, column: number): void {
    this.holes.set(this.encode(row, column), [row, column]);
  }

  private encode(row: number, column: number): number {
    return row * this.grid.numberOfColumns + column;
  }
}

export { Maze };
