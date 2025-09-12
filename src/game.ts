import { Grid, GridEventPublisher, GridRenderer } from "./grid";
import { Player, PlayerController, PlayerRenderer } from "./player";

const container = document.getElementById("app") as HTMLDivElement;

function startGame(): void {
  /* Grid config */
  const tileSize = 32;
  const gapSize = 1;

  const numberOfRows = Math.floor((container.clientHeight + gapSize) / (tileSize + gapSize));
  const numberOfColumns = Math.floor((container.clientWidth + gapSize) / (tileSize + gapSize));

  const grid = new Grid(numberOfRows, numberOfColumns);

  const gridRenderer = new GridRenderer(container, grid);
  gridRenderer.render({ tileSize, gapSize });

  grid.eventPublisher = new GridEventPublisher();
  grid.eventPublisher.subscribe(gridRenderer);

  /* Player config */
  const player = new Player();

  const playerController = new PlayerController(player);
  playerController.bindKeyboard();

  const playerRenderer = new PlayerRenderer(player, grid);
  playerRenderer.render();
}

export {
  startGame
};
