import { startGame } from "./game";
import { assetsQuery } from "./preload";

assetsQuery.then(startGame);
