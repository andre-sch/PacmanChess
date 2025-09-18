import { Player, PlayerController, PlayerEventPublisher, PlayerRenderer } from "./player";
import { Grid, GridEventPublisher, GridRenderer } from "./grid";
import { Maze } from "./maze";
import { CollisionHandler } from "./collision";

const container = document.getElementById("app") as HTMLDivElement;

function startGame(): void {
  /* Grid config */
  const tileSize = 32;
  const gapSize = 2;

  let numberOfRows = Math.min(20, Math.floor((container.clientHeight + gapSize) / (tileSize + gapSize)));
  let numberOfColumns = Math.min(23, Math.floor((container.clientWidth + gapSize) / (tileSize + gapSize)));
  if (numberOfColumns % 2 == 0) numberOfColumns--;

  const grid = new Grid(numberOfRows, numberOfColumns);

  const gridRenderer = new GridRenderer(container, grid);
  gridRenderer.render({ tileSize, gapSize });

  grid.eventPublisher = new GridEventPublisher();
  grid.eventPublisher.subscribe(gridRenderer);

  /* Player config */
  const [row, column] = grid.center;
  const player = new Player(row, column);

  const playerController = new PlayerController(player);
  playerController.bindKeyboard();

  const playerRenderer = new PlayerRenderer(player, grid);
  playerRenderer.render();

  player.eventPublisher = new PlayerEventPublisher();
  player.eventPublisher.subscribe(new CollisionHandler(grid));

  /* Maze config */
  const maze = new Maze(grid);
  maze.generate({ player });
}

export {
  startGame
};
