import { Grid, GridEventPublisher, GridRenderer } from "./grid";
import { Player, PlayerController, PlayerRenderer } from "./player";
import { EnemyRenderer, Enemy, Blinky, Inky, Pinky, Clyde } from "./enemy";
import { AgentEventPublisher } from "./agent";
import { Maze } from "./maze";
import { CollisionHandler } from "./collision";
import { GameMetadata } from "./metadata";

const container = document.querySelector("main") as HTMLElement;

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

  const playerEventPublisher = new AgentEventPublisher();
  player.eventPublisher = playerEventPublisher;

  /* Maze config */
  const maze = new Maze(grid);
  maze.generate({ player });

  /* Enemies config */
  const gameContext = { grid, player, enemies: new Map<string, Enemy>() };
  const enemyEventPublisher = new AgentEventPublisher();

  const blinky = new Blinky(gameContext, { eventPublisher: enemyEventPublisher });
  const inky = new Inky(gameContext, { eventPublisher: enemyEventPublisher });
  const pinky = new Pinky(gameContext, { eventPublisher: enemyEventPublisher });
  const clyde = new Clyde(gameContext, { eventPublisher: enemyEventPublisher });

  const enemies = [blinky, inky, pinky, clyde];
  for (const enemy of enemies) {
    gameContext.enemies.set(enemy.name, enemy);
  }

  const enemyRenderer = new EnemyRenderer(grid);
  enemyRenderer.render(...enemies);

  /* Collision config */
  const metadata = new GameMetadata({ grid, tileSize, gapSize });
  const collisionHandler = new CollisionHandler({ metadata, grid, player, enemies });

  playerEventPublisher.subscribe(collisionHandler);
  enemyEventPublisher.subscribe(collisionHandler);
}

export {
  startGame
};
