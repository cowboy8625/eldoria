// class Result<T, E> {
//   private constructor(
//     private readonly kind: "Ok" | "Err",
//     private readonly value: T | E
//   ) {}
//
//   public static ok<T>(value: T): Result<T, never> {
//     return new Result("Ok", value);
//   }
//
//   public static err<E>(error: E): Result<never, E> {
//     return new Result("Err", error);
//   }
//
//   public map<U>(fn: (value: T) => U): Result<U, E> {
//     if (this.kind === "Ok") {
//       return Result.ok(fn(this.value as T));
//     }
//     return Result.err(this.value as E);
//   }
// }
//
