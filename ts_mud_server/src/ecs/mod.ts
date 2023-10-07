import { z } from "zod";

export function createId(): string {
  return (
    (+new Date()).toString(16) +
    ((Math.random() + 100_000_000) | 0).toString(16)
  );
}

// export const PositionComponentSchema = z.object({
//   x: z.number(),
//   y: z.number(),
// });

// export const RenderableComponentSchema = z.object({
//   sprite: z.string(),
// });
//

// export type PositionComponent = z.infer<typeof PositionComponentSchema>;
// export type RenderableComponent = z.infer<typeof RenderableComponentSchema>;

export const EntitySchema = z.object({
  id: z.string(),
  components: z.record(z.unknown()),
});
export type Entity = z.infer<typeof EntitySchema>;

export const SystemSchema = z.function().args(z.array(EntitySchema));
export type System = z.infer<typeof SystemSchema>;

export function queryEntities(
  entities: Entity[],
  ...componentTypes: (keyof Entity["components"])[]
): Entity[] {
  return entities.filter((entity) => {
    return all<keyof Entity["components"]>(
      componentTypes,
      (item) => !!entity.components[item],
    );
  });
}

function all<T>(array: T[], condition: (element: T) => boolean): boolean {
  return array.reduce((result, element) => result && condition(element), true);
}

// ------------------ Usage ------------------

// Create an entitys
// const entity1: Entity = {
//   id: createId(),
//   components: {
//     position: { x: 10, y: 20 },
//     renderable: { sprite: 'player.png' },
//   },
// };
//
// const entity2: Entity = {
//   id: createId(),
//   components: {
//     position: { x: 30, y: 40 },
//     renderable: { sprite: 'enemy.png' },
//   },
// };
//
// // Create a system
// function renderSystem(entities: Entity[]) {
//   const query = queryEntities(entities, 'position', 'renderable');
//   for (const { components } of query) {
//     const position = components.position as PositionComponent;
//     const renderable = components.renderable as RenderableComponent;
//     console.log(`Render ${renderable.sprite} at (${position.x}, ${position.y})`);
//   }
// }
//
//
// const entities: Entity[] = [entity1, entity2];
// const systems = [renderSystem];
//
//
// systems.forEach((system) => {
//   system(entities);
// });
