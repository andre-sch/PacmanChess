import type { Grid } from "./grid";

const container = document.querySelector("header") as HTMLElement;
const chronometerElement = document.querySelector("#chronometer span") as HTMLSpanElement;
const chronometerHandElement = document.querySelector("#clock-hand") as HTMLDivElement;
const statusElement = document.querySelector("#status") as HTMLSpanElement;
const scoreElement = document.querySelector("#score") as HTMLSpanElement;
const livesContainer = document.querySelector("#lives") as HTMLDivElement;

class GameMetadata {
  private readonly grid: Grid;
  public readonly minLives: number = 0;
  public readonly maxLives: number = 3;
  private _lives: number;
  private _status: string;
  private _score: number;
  private _seconds: number;
  private clock: number;

  constructor(
    props: {
      grid: Grid;
      tileSize: number;
      gapSize: number;
    }
  ) {
    this.grid = props.grid;
    this.lives = this.maxLives;
    this.score = 0;

    container.style.maxWidth =
      (this.grid.numberOfColumns * props.tileSize +
      (this.grid.numberOfColumns - 1) * props.gapSize) + "px";

    this.startClock();
  }

  public startClock(): void {
    let count = 3;
    this.seconds = 0;
    this.status = "Ready";

    const countdown = setInterval(() => {
      if (count > 0) {
        this.status = count.toString();
      } else if (count == 0) {
        this.status = "Go!";
        this.clock = setInterval(() => this.seconds++, 1000);
        chronometerHandElement.classList.add("running");
      } else {
        this.status = "";
        clearInterval(countdown);
      }

      count--;
    }, 1000);
  }

  public pauseClock(): void {
    clearInterval(this.clock);
    chronometerHandElement.classList.remove("running");
  }

  public get seconds() { return this._seconds; }
  public set seconds(value: number) {
    this._seconds = value;

    const template = (this._seconds >= 3600 ? "hh:mm:ss" : "mm:ss")
      .replace("hh", this.formatUnit(this._seconds / 3600))
      .replace("mm", this.formatUnit((this._seconds % 3600) / 60))
      .replace("ss", this.formatUnit(this._seconds % 60));

    chronometerElement.textContent = template;
  }

  private formatUnit(value: number): string {
    return Math.floor(value).toString().padStart(2, "0");
  }

  public get score() { return this._score; }
  public set score(value: number) {
    this._score = value;
    if (this._score > 0) scoreElement.textContent = "+" + this._score;
    else scoreElement.textContent = "";
  }

  public get lives() { return this._lives; }
  public set lives(value: number) {
    this._lives = Math.max(this.minLives, Math.min(this.maxLives, value));
    this.renderLives();
  }

  private renderLives() {
    livesContainer.innerHTML = "";

    const livesLost = this.maxLives - this.lives;
    for (let i = 0; i < livesLost; i++) livesContainer.appendChild(emptyLife());
    for (let i = 0; i < this.lives; i++) livesContainer.appendChild(fullLife());
  }

  public get status() { return this._status; }
  public set status(value: string) {
    this._status = value;
    statusElement.textContent = value;
  }
}

function fullLife() {
  return new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" height="22" width="20" viewBox="0 0 640 640"><path fill="#3157e3" d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/></svg>`,
    "image/svg+xml"
  ).documentElement;
}

function emptyLife() {
  return new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" height="22" width="20" viewBox="0 0 640 640"><path fill="#3157e3" d="M442.9 144C415.6 144 389.9 157.1 373.9 179.2L339.5 226.8C335 233 327.8 236.7 320.1 236.7C312.4 236.7 305.2 233 300.7 226.8L266.3 179.2C250.3 157.1 224.6 144 197.3 144C150.3 144 112.2 182.1 112.2 229.1C112.2 279 144.2 327.5 180.3 371.4C221.4 421.4 271.7 465.4 306.2 491.7C309.4 494.1 314.1 495.9 320.2 495.9C326.3 495.9 331 494.1 334.2 491.7C368.7 465.4 419 421.3 460.1 371.4C496.3 327.5 528.2 279 528.2 229.1C528.2 182.1 490.1 144 443.1 144zM335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1C576 297.7 533.1 358 496.9 401.9C452.8 455.5 399.6 502 363.1 529.8C350.8 539.2 335.6 543.9 320 543.9C304.4 543.9 289.2 539.2 276.9 529.8C240.4 502 187.2 455.5 143.1 402C106.9 358.1 64 297.7 64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1L320 171.8L335 151.1z"/></svg>`,
    "image/svg+xml"
  ).documentElement;
}

export {
  GameMetadata
};
