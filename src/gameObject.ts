export abstract class GameObject {
  public readonly id: string = crypto.randomUUID();
  constructor (public readonly type: string) {}
}
