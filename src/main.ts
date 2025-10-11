import { startGame } from "./game";
import { assetsQuery } from "./preload";
import { css } from "./styles";

assetsQuery.then((assets) => {
  promotionLazyInitialization(assets);
  startGame();
});

function promotionLazyInitialization(assets: HTMLImageElement[] = []): void {
  const whiteRookImage = assets.find(image => image.src.includes("white-rook"))!;
  css.insertRule(`.player.promoted::after { --white-rook-url: url("${whiteRookImage.src}"); }`);
}
