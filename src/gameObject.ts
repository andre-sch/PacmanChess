export abstract class GameObject {
  public readonly id: string;
  public traversable: boolean = true;

  constructor (
    public readonly type: string,
    public readonly variations: Set<string> = new Set()
  ) {
    this.id = crypto.randomUUID();
  }
}
