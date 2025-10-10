import type { GridRenderer } from "./grid";

const header = document.querySelector("header") as HTMLElement;
const footer = document.querySelector("footer") as HTMLElement;
const chronometerElement = document.querySelector("#chronometer span") as HTMLSpanElement;
const chronometerHandElement = document.querySelector("#clock-hand") as HTMLDivElement;
const statusElement = document.querySelector("#status") as HTMLSpanElement;
const scoreElement = document.querySelector("#score") as HTMLSpanElement;
const livesContainer = document.querySelector("#lives") as HTMLDivElement;

class GameMetadata {
  public readonly minLives: number = 0;
  public readonly maxLives: number = 3;
  private _lives: number;
  private _status: string;
  private _score: number;
  private _seconds: number;
  private clock: number;

  constructor(gridRenderer: GridRenderer) {
    this.lives = this.maxLives;
    this.seconds = 0;
    this.score = 0;

    header.style.visibility = "visible";
    header.style.maxWidth = gridRenderer.maxWidth();

    footer.style.visibility = "visible";
    footer.style.height = `calc(100% - ${gridRenderer.maxHeight()})`;
    footer.style.maxWidth = gridRenderer.maxWidth();

    this.startClock();
  }

  public startClock(): void {
    let count = 3;
    this.status = "Ready";

    const countdown = setInterval(() => {
      if (count > 0) {
        this.status = count.toString();
      } else if (count == 0) {
        this.status = "Go!";
        this.resumeClock();
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

  public resumeClock(): void {
    this.clock = setInterval(() => this.seconds++, 1000);
    chronometerHandElement.classList.add("running");
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" fill="#3157e3"><path d="m480-144-50-45q-100-89-165-152.5t-102.5-113Q125-504 110.5-545T96-629q0-89 61-150t150-61q49 0 95 21t78 59q32-38 78-59t95-21q89 0 150 61t61 150q0 43-14 83t-51.5 89q-37.5 49-103 113.5T528-187l-48 43Z"/></svg>`,
    "image/svg+xml"
  ).documentElement;
}

function emptyLife() {
  return new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" fill="#3157e3" stroke="#3157e3" stroke-width="30"><path d="m480-144-50-45q-100-89-165-152.5t-102.5-113Q125-504 110.5-545T96-629q0-89 61-150t150-61q49 0 95 21t78 59q32-38 78-59t95-21q89 0 150 61t61 150q0 43-14 83t-51.5 89q-37.5 49-103 113.5T528-187l-48 43Zm0-97q93-83 153-141.5t95.5-102Q764-528 778-562t14-67q0-59-40-99t-99-40q-35 0-65.5 14.5T535-713l-35 41h-40l-35-41q-22-26-53.5-40.5T307-768q-59 0-99 40t-40 99q0 33 13 65.5t47.5 75.5q34.5 43 95 102T480-241Zm0-264Z"/></svg>`,
    "image/svg+xml"
  ).documentElement;
}

export {
  GameMetadata
};
