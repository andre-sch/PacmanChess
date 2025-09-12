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
  public readonly elements: (GameObject | null)[][];
  public eventPublisher?: GridEventPublisher;

  constructor(
    public readonly numberOfRows: number,
    public readonly numberOfColumns: number,
    options?: { eventPublisher: GridEventPublisher }
  ) {
    this.elements = [];
    this.eventPublisher = options?.eventPublisher;

    for (let i = 0; i < this.numberOfRows; i++) {
      this.elements.push(Array(this.numberOfColumns).fill(null));
    }
  }

  public remove(row: number, column: number): GameObject | null {
    const element = this.elements[row][column];
    this.update(row, column, null);
    return element;
  }

  public update(row: number, column: number, value: GameObject | null): void {
    if (
      row < 0 || this.numberOfRows <= row ||
      column < 0 || this.numberOfColumns <= column
    ) return;

    this.elements[row][column] = value;
    this.eventPublisher?.publishUpdate(row, column);
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
    gridElement.style.gridTemplateColumns = `repeat(${this.grid.numberOfColumns}, ${props.tileSize}px)`;
    gridElement.style.gridTemplateRows = `repeat(${this.grid.numberOfRows}, ${props.tileSize}px)`;
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

    const object = this.grid.elements[row][column];
    if (object) {
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
