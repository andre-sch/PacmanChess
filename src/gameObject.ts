export abstract class GameObject {
  public readonly id: string;

  constructor (
    public readonly type: string,
    public variations: string[] = []
  ) {
    this.id = crypto.randomUUID();
  }
}
