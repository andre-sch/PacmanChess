import { startGame } from "./game";
import { assetsQuery } from "./preload";

assetsQuery.then(() => startGame());

/*
todo: insert player in the grid
renderer should track grid updates

*/
