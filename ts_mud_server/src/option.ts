export type Some<T> = {
  tag: string;
  value: T;
};

export type None = {
  tag: string;
};

export class Option<T> {
  value: Some<T> | None;
  constructor(value: Some<T> | None) {
    this.value = value;
  }

  public static none<T>(): Option<T> {
    return new Option({tag: 'None'});
  }

  public static some<T>(value: T): Option<T> {
    return new Option<T>({tag: 'Some', value});
  }

  public isNone(): boolean {
    return this.value.tag === 'None';
  }

  public isSome(): boolean {
    return this.value.tag === 'Some';
  }

  public unwrap(): T | never {
    if (this.isNone()) {
      throw new Error('Option is None and cannot be unwrapped');
    }
    const value = this.value as Some<T>;
    return value.value;
  }

  public unwrapOr(defaultValue: T): T {
    if (this.isNone()) {
      return defaultValue;
    }
    const value = this.value as Some<T>;
    return value.value;
  }

  public map<U>(fn: (value: T) => U): Option<U> {
    if (this.isNone()) {
      return Option.none();
    }
    const value = this.value as Some<T>;
    return Option.some(fn(value.value));
  }

  public andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    if (this.isNone()) {
      return Option.none();
    }
    const value = this.value as Some<T>;
    return fn(value.value);
  }
}
