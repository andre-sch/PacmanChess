import { Grid, GridEventPublisher, GridRenderer } from "./grid";
import { Player, PlayerController, PlayerRenderer } from "./player";
import { EnemyRenderer, Enemy, Blinky, Inky, Pinky, Clyde } from "./enemy";
import { AgentRenderer, RendererOrchestrator } from "./renderer";
import { Maze } from "./maze";
import { GameOrchestrator } from "./gameOrchestrator";
import { GameMetadata } from "./metadata";
import { Joystick } from "./joystick";

const container = document.querySelector("main") as HTMLElement;

function startGame(): void {
  /* Support devices without keyboard */
  const joystick = new Joystick();
  joystick.attachEvents();

  /* Grid config */
  const tileSize = 32;
  const gapSize = 2;

  let numberOfRows = Math.floor((container.clientHeight + gapSize) / (tileSize + gapSize));
  let numberOfColumns = Math.floor((container.clientWidth + gapSize) / (tileSize + gapSize));
  if (numberOfColumns % 2 == 0) numberOfColumns--;

  const grid = new Grid(numberOfRows, numberOfColumns);

  const gridRenderer = new GridRenderer(container, grid, tileSize, gapSize);
  gridRenderer.render();

  grid.eventPublisher = new GridEventPublisher();
  grid.eventPublisher.subscribe(gridRenderer);

  /* Player config */
  const [row, column] = grid.center;
  const player = new Player(row, column);

  const playerController = new PlayerController(player);
  playerController.bindKeyboard();
  joystick.bind(player);

  const playerRenderer = new PlayerRenderer(player, grid);
  playerRenderer.render();

  /* Maze config */
  const maze = new Maze(grid);
  maze.generate({ player });

  /* Enemies config */
  const gameContext = { grid, player, enemies: new Map<string, Enemy>() };

  const blinky = new Blinky(gameContext);
  const inky = new Inky(gameContext);
  const pinky = new Pinky(gameContext);
  const clyde = new Clyde(gameContext);

  const enemies = [blinky, inky, pinky, clyde];
  const renderers: AgentRenderer[] = [];
  for (const enemy of enemies) {
    gameContext.enemies.set(enemy.name, enemy);

    const enemyRenderer = new EnemyRenderer(enemy, grid);
    renderers.push(enemyRenderer);
  } renderers.push(playerRenderer);

  /* Orchestration config */
  const renderer = new RendererOrchestrator(renderers);
  renderer.render();
  renderer.resumeRenderingUpdate();

  const metadata = new GameMetadata(gridRenderer);
  const gameOrchestrator = new GameOrchestrator({ metadata, grid, maze, player, enemies, renderer });
  playerRenderer.attachSubscriber(() => gameOrchestrator.onStateChange());
}

export { startGame };
