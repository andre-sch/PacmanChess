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

export { AgentEventPublisher };
export type { AgentMovement, AgentSubscriber };
