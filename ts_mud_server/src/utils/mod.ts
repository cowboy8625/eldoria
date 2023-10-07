export function randomInt(min: number, max: number): number {
  const randomDecimal = Math.random();
  const randomInRange = min + randomDecimal * (max - min);
  return Math.floor(randomInRange);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function saturatingSub(a: number, b: number): number {
  return Math.max(0, Math.min(a, b));
}
