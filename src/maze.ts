import { GameObject } from "./gameObject";
import { Grid } from "./grid";

class Hole extends GameObject {
  constructor(
    public row: number,
    public column: number,
  ) {
    super("hole");
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

    this.minHole = options?.minHole || 2;
    this.maxHole = options?.maxHole || 4;

    const averageHole = (this.minHole + this.maxHole) / 2;
    const numberOfCells = grid.numberOfRows * grid.numberOfColumns;
    this.numberOfHoles = Math.ceil((0.25 * numberOfCells) / averageHole);
  }

  public generate(props: { player: [number, number] }): void {
    this.generateHoles();
    this.generateDots(props);
  }

  private generateHoles(): void {
    for (let i = 0; i < this.numberOfHoles; i++) {
      let row, column: number;
      let object: GameObject | null;
      do {
        row = Math.floor(Math.random() * this.grid.numberOfRows);
        column = Math.floor(Math.random() * this.grid.numberOfColumns);

        object = this.grid.elements[row][column]
      } while (object != null);

      const setOfHoles = [new Hole(row, column)];

      const holeSize = Math.floor(Math.random() * (this.maxHole - this.minHole + 1)) + this.minHole;

      while (setOfHoles.length < holeSize) {
        const holeOptions = [...setOfHoles];

        let neighbor: GameObject | null | undefined;
        do {
          let index = Math.floor(Math.random() * holeOptions.length);
          const hole = holeOptions.splice(index, 1)[0];

          const emptyPoints = this.emptyNeighborsOf(hole.row, hole.column);

          if (emptyPoints.length > 0) {
            index = Math.floor(Math.random() * emptyPoints.length);
            const point = emptyPoints.splice(index, 1)[0];

            row = point.row;
            column = point.column;
            neighbor = this.grid.elements[row][column];
          }
        } while (neighbor != null && holeOptions.length > 0);

        if (neighbor != null) break;
        setOfHoles.push(new Hole(row, column));
      }

      for (const hole of setOfHoles) {
        this.grid.update(hole.row, hole.column, hole);
      }
    }
  }

  private generateDots(props: { player: [number, number] }): void {
    const encode = (row: number, column: number) => row * this.grid.numberOfColumns + column;
    const decode = (id: number): [number, number] => [Math.floor(id / this.grid.numberOfColumns), id % this.grid.numberOfColumns];

    const visited = new Set<number>();
    visited.add(encode(props.player[0], props.player[1]));

    const queue: [number, number][] = [];
    queue.push(props.player);

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;

      for (const neighbor of this.emptyNeighborsOf(row, col)) {
        const id = encode(neighbor.row, neighbor.column);
        if (!visited.has(id)) {
          visited.add(id);
          queue.push([neighbor.row, neighbor.column]);
          this.grid.update(neighbor.row, neighbor.column, new Dot());
        }
      }
    }

    const points = Array.from(visited.values()).sort((a, b) => a - b);
    const numberOfPellets = Math.min(7, Math.floor(visited.size / 45));

    const range = Math.floor(visited.size / (numberOfPellets + 1));

    for (let i = 0; i < numberOfPellets; i++) {
      const [row, column] = decode(points[(i+1) * range]);
      this.grid.update(row, column, new Pellet());
    }
  }

  private emptyNeighborsOf(row: number, column: number) {
    const emptyNeighbors: { row: number; column: number; }[] = [];
    const neighborsDelta = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dx, dy] of neighborsDelta) {
      const neighborRow = row + dx;
      const neighborColumn = column + dy;

      if (
        0 <= neighborRow && neighborRow < this.grid.numberOfRows &&
        0 <= neighborColumn && neighborColumn < this.grid.numberOfColumns &&
        this.grid.elements[neighborRow][neighborColumn] == null
      ) {
        emptyNeighbors.push({ row: neighborRow, column: neighborColumn });
      }
    }

    return emptyNeighbors;
  }
}

export { Maze };
