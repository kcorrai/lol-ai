import type { Prisma } from "@prisma/client";

// Wraps the unavoidable Prisma JSON bridge in one explicit place.
// Prisma's JSONB columns use JsonValue (reads) and InputJsonValue (writes),
// neither of which is assignable to/from typed domain interfaces.
// These helpers make the intent visible without scattering `as unknown as` everywhere.

export function toJsonInput<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export function fromJsonValue<T>(value: Prisma.JsonValue | unknown): T {
  return value as unknown as T;
}
