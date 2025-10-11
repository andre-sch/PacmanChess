import { Player } from "./player";
import { Direction } from "./direction";

const joystickElement = document.querySelector("#joystick") as HTMLDivElement;
const joystickKnob = document.querySelector("#joystick-knob") as HTMLDivElement;
const joystickRing = document.querySelector("#joystick-inner-ring") as HTMLDivElement;

class Joystick {
  private player: Player;
  constructor() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      joystickElement.classList.add("enabled");
    }
  }

  public attachEvents() {
    document.addEventListener("pointerdown", this.start.bind(this));
    document.addEventListener("pointermove", this.move.bind(this));
    document.addEventListener("pointerup", this.end.bind(this));
  }

  public bind(player: Player) {
    this.player = player;
  }

  private end() {
    joystickKnob.style.transform = "";
  }

  private start(event: PointerEvent) {
    this.control(event);
  }

  private move(event: PointerEvent) {
    this.control(event);
  }

  private control(event: PointerEvent) {
    if (event.pressure == 0) return;

    this.updateTranslation(event);
    this.updatePlayerMovement(event);
  }

  private updateTranslation(event: PointerEvent) {
    const { relativeX, relativeY } = this.calculateRelativePosition(event);

    const knobRadius = joystickRing.offsetWidth / 2;
    const knobAngle = Math.atan2(relativeY, relativeX);

    const translateX = this.calculateKnobTranslation({
      distance: relativeX,
      maxDistance: knobRadius * Math.cos(knobAngle)
    });

    const translateY = this.calculateKnobTranslation({
      distance: relativeY,
      maxDistance: knobRadius * Math.sin(knobAngle)
    });

    joystickKnob.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }

  private calculateRelativePosition(event: PointerEvent) {
    const pointerX = Math.round(event.clientX);
    const pointerY = Math.round(event.clientY);

    const joystickRect = joystickElement.getBoundingClientRect();
    const joystickCenterX = Math.round(joystickRect.left + joystickRect.width / 2);
    const joystickCenterY = Math.round(joystickRect.top + joystickRect.height / 2);

    return {
      relativeX: pointerX - joystickCenterX,
      relativeY: pointerY - joystickCenterY
    };
  }

  private calculateKnobTranslation(props: { distance: number; maxDistance: number; }) {
    const sign = Math.sign(props.distance);
    const clipped = Math.min(Math.abs(props.distance), Math.abs(props.maxDistance));
    const translation = sign * clipped;
    return translation;
  }

  private updatePlayerMovement(event: PointerEvent) {
    const { relativeX, relativeY } = this.calculateRelativePosition(event);
    let knobAngle = 180 / Math.PI * Math.atan2(relativeY, relativeX);

    knobAngle = (knobAngle - 45) % 360;

    if (knobAngle < 0) knobAngle = 360 - Math.abs(knobAngle);

    const directionByRange: {
      [Key: string]: [number, number];
    } = {
      "down": [0, 90],
      "left": [90, 180],
      "up": [180, 270],
      "right": [270, 360]
    }

    for (const direction in directionByRange) {
      const [min, max] = directionByRange[direction];
      if (min <= knobAngle && knobAngle < max) {
        this.player.direction = direction as Direction;
        return;
      }
    }
  }
}

export { Joystick };
