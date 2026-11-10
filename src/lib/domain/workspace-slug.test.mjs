import assert from "node:assert/strict";
import test from "node:test";
import { slugifyWorkspaceName } from "./workspace-slug.mjs";

test("converts Vietnamese workspace names into URL-safe slugs", () => {
  assert.equal(slugifyWorkspaceName("Dự án nhóm mùa hè"), "du-an-nhom-mua-he");
});

test("normalizes punctuation and repeated whitespace", () => {
  assert.equal(slugifyWorkspaceName("  Product & Design   Squad! "), "product-design-squad");
});

test("removes a trailing separator when truncation lands on a separator", () => {
  const slug = slugifyWorkspaceName("a".repeat(47) + " " + "b".repeat(20));
  assert.equal(slug.length, 47);
  assert.equal(slug.endsWith("-"), false);
});

test("caps a separator-free slug at 48 characters", () => {
  const slug = slugifyWorkspaceName("a".repeat(60));
  assert.equal(slug.length, 48);
  assert.equal(slug.endsWith("-"), false);
});

test("returns an empty slug for names that cannot be represented in ASCII", () => {
  assert.equal(slugifyWorkspaceName("東京"), "");
});
