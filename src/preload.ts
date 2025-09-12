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
  "/assets/white-pawn.png"
]);

export {
  assetsQuery
};
