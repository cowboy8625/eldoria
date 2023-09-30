import { Option } from './option';

export class Player {
  name: string;
  password: Option<string>;
  constructor() {
    this.name = 'guest';
    this.password = Option.none();
  }

  public login(pword: string): boolean {
    return this.password.map(p => p === pword).unwrapOr(false);
  }

  public hasName(): boolean {
    return this.name !== 'guest';
  }

  public hasPassword(): boolean {
    return this.password.isSome();
  }
}
