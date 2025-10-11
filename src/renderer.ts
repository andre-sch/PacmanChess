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

class RendererOrchestrator extends AgentRenderer {
  private timeout: number;
  private interval: number;

  constructor(private readonly renderers: AgentRenderer[]) {
    super();
    this.timeout = renderers
      .map((renderer) => renderer.minRenderingTimeout())
      .reduce((a, b) => greatestCommonDivisor(a, b));
  }

  public renderingTimeout(): number {
    return this.timeout;
  }

  public render() {
    for (const renderer of this.renderers) {
      renderer.render();
    }
  }

  public pauseRenderingUpdate() {
    clearInterval(this.interval);
  }

  public resumeRenderingUpdate() {
    let time = 0;
    this.interval = setInterval(() => {
      for (const renderer of this.renderers) {
        if (time % renderer.renderingTimeout() == 0) {
          renderer.updateRendering();
        }
      }

      time += this.timeout;
    }, this.timeout);
  }

  public updateRendering() {
    for (const renderer of this.renderers) {
      renderer.updateRendering();
    }
  }
}

function greatestCommonDivisor(a: number, b: number) {
  let tmp: number;
  while (b != 0) {
    tmp = b;
    b = a % b;
    a = tmp;
  }

  return a;
}

export {
  AgentRenderer,
  RendererOrchestrator
};
