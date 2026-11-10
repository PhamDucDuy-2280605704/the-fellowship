/**
 * @typedef {{ questId: string, dependsOnQuestId: string }} QuestDependency
 * @typedef {"self_dependency" | "duplicate_dependency" | "dependency_cycle"} DependencyValidationError
 */

/**
 * Validates a proposed directed edge: questId depends on dependsOnQuestId.
 * The dependency graph must remain acyclic so quests cannot block one another forever.
 * @param {readonly QuestDependency[]} dependencies
 * @param {string} questId
 * @param {string} dependsOnQuestId
 * @returns {DependencyValidationError | null}
 */
export function validateDependencyAddition(dependencies, questId, dependsOnQuestId) {
  if (questId === dependsOnQuestId) return "self_dependency";

  if (dependencies.some((dependency) =>
    dependency.questId === questId && dependency.dependsOnQuestId === dependsOnQuestId)) {
    return "duplicate_dependency";
  }

  const adjacency = new Map();
  for (const dependency of dependencies) {
    const outgoing = adjacency.get(dependency.questId) ?? [];
    outgoing.push(dependency.dependsOnQuestId);
    adjacency.set(dependency.questId, outgoing);
  }

  const pending = [dependsOnQuestId];
  const visited = new Set();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    if (current === questId) return "dependency_cycle";
    visited.add(current);
    pending.push(...(adjacency.get(current) ?? []));
  }

  return null;
}
