function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = reject;
        })
    )
  );
}

const assetsQuery = preloadImages([
  "/assets/black-pawn-blinky.png",
  "/assets/black-pawn-inky.png",
  "/assets/black-pawn-pinky.png",
  "/assets/black-pawn-clyde.png",
  "/assets/white-pawn.png",
  "/assets/white-rook.png"
]);

export {
  assetsQuery
};
