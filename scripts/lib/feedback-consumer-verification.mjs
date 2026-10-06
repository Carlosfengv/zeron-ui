import { verifyUnificationConsumer } from "./unification-consumer-verification.mjs";

/** Feedback uses the same copied-source and compiled-CSS checks as other foundations. */
export async function verifyFeedbackConsumer(options) {
  await verifyUnificationConsumer(options);
}
