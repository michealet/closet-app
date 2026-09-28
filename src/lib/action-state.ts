/** Result shape shared by form Server Actions used with useActionState. */
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const idleState: ActionState = { status: "idle" };
