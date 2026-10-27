import fs from "fs";
import { DatabaseSync } from "node:sqlite";

const source = "C:/Users/noman.fayyaz/Desktop/WinBachat-Shopify-Menu.txt";
const databasePath = "C:/Users/noman.fayyaz/Desktop/menu-database/data/menu.db";
const lines = fs.readFileSync(source, "utf8").split(/\r?\n/);
const start = lines.findIndex((line) => line.trim() === "FULL MENU");
if (start < 0) throw new Error("FULL MENU section was not found");

const items = [];
for (const line of lines.slice(start + 1)) {
  if (!line.trim()) continue;
  const match = line.match(/^(\s*)(?:(\d+)\.\s+|-\s+)(.+)$/);
  if (!match) throw new Error(`Could not read line: ${line}`);
  const indent = match[1].length;
  const depth = match[2] ? Number(match[2]) : 3 + (indent - 8) / 4;
  if (!Number.isInteger(depth) || depth < 1) throw new Error(`Bad depth: ${line}`);
  const title = match[3].match(/^(.*?)\s*\(collection title:\s*(.*?)\)\s*$/);
  items.push({
    depth,
    name: (title ? title[1] : match[3]).trim(),
    description: title ? title[2].trim() : "",
  });
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("BEGIN");
db.exec("DELETE FROM products");
db.exec("DELETE FROM categories");

const insert = db.prepare(
  "INSERT INTO categories (parent_id, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)",
);
const used = new Set();
const sortByParent = new Map();
const stack = [];

for (const item of items) {
  while (stack.length && stack[stack.length - 1].depth >= item.depth) stack.pop();
  const parentId = stack.length ? stack[stack.length - 1].id : null;
  const parentKey = parentId ?? 0;
  const sortOrder = (sortByParent.get(parentKey) ?? 0) + 1;
  sortByParent.set(parentKey, sortOrder);
  let slug = slugify(item.name);
  let n = 2;
  while (used.has(slug)) slug = `${slugify(item.name)}-${n++}`;
  used.add(slug);
  const result = insert.run(parentId, item.name, slug, item.description, sortOrder);
  stack.push({ id: Number(result.lastInsertRowid), depth: item.depth });
}

db.exec("COMMIT");
const row = db.prepare("SELECT COUNT(*) AS total FROM categories").get();
console.log(`imported ${row.total} categories`);
db.close();
