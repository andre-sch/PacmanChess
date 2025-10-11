import type { GameObject } from "./gameObject";

interface AgentMovement {
  agent: GameObject;
  previousPosition: [number, number];
  nextPosition: [number, number];
}

interface AgentSubscriber {
  update(context: AgentMovement): void;
}

class AgentEventPublisher {
  private subscribers: AgentSubscriber[] = [];

  public subscribe(subscriber: AgentSubscriber): void {
    this.subscribers.push(subscriber);
  }

  public publishUpdate(context: AgentMovement): void {
    this.subscribers.forEach(subscriber => subscriber.update(context));
  }
}

abstract class AgentRenderer {
  abstract render(): void;
  abstract pauseRenderingUpdate(): void;
  abstract resumeRenderingUpdate(): void;
  abstract updateRendering(): void;
  abstract renderingTimeout(): number;
  public minRenderingTimeout() {
    return this.renderingTimeout();
  }
}

export { AgentEventPublisher, AgentRenderer };
export type { AgentMovement, AgentSubscriber };
