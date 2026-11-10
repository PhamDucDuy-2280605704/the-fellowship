import assert from "node:assert/strict";
import test from "node:test";
import { validateDependencyAddition } from "./quest-dependencies.mjs";

const dependencies = [
  { questId: "quest-b", dependsOnQuestId: "quest-a" },
  { questId: "quest-c", dependsOnQuestId: "quest-b" },
];

test("allows a dependency that does not create a cycle", () => {
  assert.equal(validateDependencyAddition(dependencies, "quest-d", "quest-c"), null);
});

test("rejects a quest depending on itself", () => {
  assert.equal(validateDependencyAddition(dependencies, "quest-a", "quest-a"), "self_dependency");
});

test("rejects a duplicate dependency", () => {
  assert.equal(validateDependencyAddition(dependencies, "quest-b", "quest-a"), "duplicate_dependency");
});

test("rejects a dependency that closes a transitive cycle", () => {
  assert.equal(validateDependencyAddition(dependencies, "quest-a", "quest-c"), "dependency_cycle");
});
