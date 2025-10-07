import type { GameObject } from "./gameObject";

interface GridUpdate {
  row: number;
  column: number;
}

interface GridSubscriber {
  update(context: GridUpdate): void;
}

class GridEventPublisher {
  private subscribers: GridSubscriber[] = [];

  public subscribe(subscriber: GridSubscriber): void {
    this.subscribers.push(subscriber);
  }

  public publishUpdate(row: number, column: number) {
    this.subscribers.forEach(subscriber => subscriber.update({ row, column }));
  }
}

class Grid {
  public readonly elements: GameObject[][][];
  public eventPublisher?: GridEventPublisher;

  constructor(
    public readonly numberOfRows: number,
    public readonly numberOfColumns: number,
    options?: { eventPublisher: GridEventPublisher }
  ) {
    this.elements = [];
    this.eventPublisher = options?.eventPublisher;

    for (let i = 0; i < this.numberOfRows; i++) {
      this.elements.push(Array.from({ length: this.numberOfColumns }, () => []));
    }
  }

  public get center(): [number, number] {
    return [
      Math.floor(this.numberOfRows / 2),
      Math.floor(this.numberOfColumns / 2)
    ];
  }

  public get topLeft(): [number, number] { return [0, 0]; }
  public get topRight(): [number, number] { return [0, this.numberOfColumns - 1]; }
  public get bottomLeft(): [number, number] { return [this.numberOfRows - 1, 0]; }
  public get bottomRight(): [number, number] { return [this.numberOfRows - 1, this.numberOfColumns - 1]; }

  public inBounds(row: number, column: number): boolean {
    return (
      0 <= row && row < this.numberOfRows &&
      0 <= column && column < this.numberOfColumns
    );
  }

  public onEdge(row: number, column: number): boolean {
    return (
      row == 0 || row == this.numberOfRows - 1 ||
      column == 0 || column == this.numberOfColumns - 1
    );
  }

  public canTraverse(row: number, column: number): boolean {
    return (
      this.inBounds(row, column) &&
      (this.elements[row][column].length == 0 ||
      this.elements[row][column][0].traversable == true)
    );
  }

  public add(row: number, column: number, object: GameObject): void {
    if (!this.inBounds(row, column)) return;

    const index = this.elements[row][column].findIndex(element => element.id == object.id);
    if (index >= 0) this.elements[row][column].splice(index, 1, object);
    else this.elements[row][column].unshift(object);

    this.eventPublisher?.publishUpdate(row, column);
  }

  public remove(row: number, column: number, object: GameObject): void {
    const index = this.elements[row][column].findIndex(element => element.id == object.id);
    if (index >= 0) {
      this.elements[row][column].splice(index, 1);
      this.eventPublisher?.publishUpdate(row, column);
    }
  }

  public update(row: number, column: number, object: GameObject): void {
    this.remove(row, column, object);
    this.add(row, column, object);
  }

  public generateSpacedPoints(n: number, options?: { centerRadius: number }): [number, number][] {
    const centerRadius = options?.centerRadius || 0;

    const k = Math.ceil(Math.sqrt(n));
    const blockRows = Math.ceil(this.numberOfRows / k);
    const blockColumns = Math.ceil(this.numberOfColumns / k);

    const blocks: { row: number; column: number }[] = [];
    for (let i = 0; i < this.numberOfRows; i += blockRows) {
      for (let j = 0; j < this.numberOfColumns; j += blockColumns) {
        blocks.push({ row: i, column: j });
      }
    }

    // shuffle
    for (let i = blocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }

    const chosenBlocks = blocks.slice(0, n);

    const center = this.center;
    const points: [number, number][] = [];
    for (const block of chosenBlocks) {
      let row, column: number;
      do {
        row = block.row + Math.floor(Math.random() * blockRows);
        column = block.column + Math.floor(Math.random() * blockColumns);
      } while (
        !this.inBounds(row, column) ||
        this.elements[row][column] != null ||
        Math.hypot(row - center[0], column - center[1]) <= centerRadius
      );

      points.push([
        Math.min(row, this.numberOfRows - 1),
        Math.min(column, this.numberOfColumns - 1)
      ]);
    }

    return points;
  }
}

class GridRenderer implements GridSubscriber {
  constructor(
    private readonly container: HTMLElement,
    private readonly grid: Grid
  ) {}

  public render(props: {
    tileSize: number;
    gapSize: number;
  }) {
    let gridElement = document.getElementById("grid");
    if (gridElement) gridElement.remove();

    gridElement = document.createElement("div");
    gridElement.id = "grid";
    gridElement.style.display = "grid";
    gridElement.style.maxWidth = (this.grid.numberOfColumns * props.tileSize + (this.grid.numberOfColumns - 1) * props.gapSize) + "px";
    gridElement.style.maxHeight = (this.grid.numberOfRows * props.tileSize + (this.grid.numberOfRows - 1) * props.gapSize) + "px";
    gridElement.style.gridTemplateColumns = `repeat(${this.grid.numberOfColumns}, 1fr)`;
    gridElement.style.gap = `${props.gapSize}px`;

    for (let i = 0; i < this.grid.numberOfRows; i++) {
      for (let j = 0; j < this.grid.numberOfColumns; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        gridElement.appendChild(cell);
      }
    }

    this.container.appendChild(gridElement);
  }

  public update(context: GridUpdate): void {
    const { row, column } = context;
    const updatedElement = document.querySelector(`.cell:nth-child(${row * this.grid.numberOfColumns + column + 1})`);
    if (!updatedElement) throw new Error("Failed to update element");

    updatedElement.className = "cell";

    for (const object of this.grid.elements[row][column]) {
      updatedElement.classList.add(object.type);

      for (const variation of object.variations) {
        updatedElement.classList.add(variation);
      }
    }
  }
}

export {
  Grid,
  GridEventPublisher,
  GridRenderer
};
