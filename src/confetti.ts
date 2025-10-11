declare const confetti: any;

interface Options {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
}

function throwParticles(count: number, options: Options) {
  confetti({
    particleCount: count,
    origin: { x: 0.5, y: 0.8 },
    colors: ['#fff', '#3a5ee4', '#1c41ca'],
    ...options
  });
}

function throwConfetti() {
  throwParticles(20, { spread: 120, startVelocity: 45 });
  throwParticles(20, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  throwParticles(40, { spread: 60 });
  throwParticles(50, { spread: 26, startVelocity: 55 });
  throwParticles(70, { spread: 100, decay: 0.91, scalar: 0.8 });
}

export { throwConfetti };
