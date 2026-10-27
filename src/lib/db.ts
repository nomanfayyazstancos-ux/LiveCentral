import fs from "fs";
import path from "path";
import { connection } from "next/server";
import { DatabaseSync, type SqlValue } from "node:sqlite";
import { MongoClient, type Db } from "mongodb";

export type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  unit: string;
  marketPrice: number | null;
  price: number | null;
  imageUrl: string;
  tags: string;
};

export type CategoryNode = Category & {
  depth: number;
  productCount: number;
  insideCount: number;
  children: CategoryNode[];
};

export class MenuError extends Error {}

export type UserRole = "admin" | "edit" | "view";

const adminEmail = "nomanfayyazstancos@gmail.com";

export type UserStatus = "active" | "pending";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type Activity = {
  id: number;
  action: string;
  kind: string;
  name: string;
  detail: string;
  actor: string;
  createdAt: string;
  targetId: number | null;
  placeId: number | null;
};

type CategoryDoc = {
  _id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

type ProductDoc = {
  _id: number;
  categoryId: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  unit: string;
  marketPrice: number | null;
  price: number | null;
  imageUrl: string;
  tags: string;
};

type UserDoc = {
  _id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type SessionDoc = {
  _id: string;
  userId: number;
  createdAt: string;
};

type ActivityDoc = {
  _id: number;
  action: string;
  kind: string;
  name: string;
  detail: string;
  actor: string;
  createdAt: string;
  targetId: number | null;
  placeId: number | null;
};

type CounterDoc = {
  _id: string;
  seq: number;
};

type MenuData = {
  categories: Category[];
  products: Product[];
  byId: Map<number, Category>;
  productsByCategory: Map<number, Product[]>;
  nodeById: Map<number, CategoryNode>;
  tree: CategoryNode[];
  revision: number;
};

const globalForDb = globalThis as unknown as {
  mongoDb?: Db;
  mongoReady?: Promise<Db>;
  menuCache?: MenuData | null;
  menuLoading?: Promise<MenuData> | null;
  menuEpoch?: number;
  userCache?: Map<string, User | null>;
};

async function clearMenuCache() {
  globalForDb.menuEpoch = (globalForDb.menuEpoch ?? 0) + 1;
  globalForDb.menuCache = null;
  globalForDb.menuLoading = null;
  const db = await database();
  await db.collection<CounterDoc>("counters").updateOne({ _id: "menu" }, { $inc: { seq: 1 } }, { upsert: true });
}

function userCache() {
  if (!globalForDb.userCache) globalForDb.userCache = new Map();
  return globalForDb.userCache;
}

function clearUserCache() {
  globalForDb.userCache = new Map();
}

function mongoUri() {
  return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/livecentral";
}

async function openDatabase() {
  const client = new MongoClient(mongoUri(), { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db();
    globalForDb.mongoDb = db;
    await ensureIndexes(db);
    await migrateFromSqlite(db);
    if ((await db.collection("categories").countDocuments()) === 0) await seed();
    await db.collection<UserDoc>("users").updateOne({ email: adminEmail }, { $set: { role: "admin" } });
    return db;
  } catch (error) {
    globalForDb.mongoDb = undefined;
    await client.close().catch(() => undefined);
    if (error instanceof MenuError) throw error;
    const detail = error instanceof Error ? error.message : "connection failed";
    throw new MenuError(`MongoDB connect nahi ho raha (${detail}). Local MongoDB 127.0.0.1:27017 par chalna chahiye.`);
  }
}

async function database() {
  await connection();
  if (globalForDb.mongoDb) return globalForDb.mongoDb;
  if (!globalForDb.mongoReady) {
    globalForDb.mongoReady = openDatabase().finally(() => {
      if (!globalForDb.mongoDb) globalForDb.mongoReady = undefined;
    });
  }
  return globalForDb.mongoReady;
}

async function ensureIndexes(db: Db) {
  await db.collection("categories").createIndex({ slug: 1 }, { unique: true });
  await db.collection("categories").createIndex({ parentId: 1, sortOrder: 1 });
  await db.collection("products").createIndex({ categoryId: 1, slug: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ userId: 1 });
}

function sqliteText(value: SqlValue | undefined) {
  return value == null ? "" : String(value);
}

function sqliteNum(value: SqlValue | undefined) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function migrateFromSqlite(db: Db) {
  if ((await db.collection("categories").countDocuments()) > 0) return;
  const file = path.join(process.cwd(), "data", "menu.db");
  if (!fs.existsSync(file)) return;
  const sqlite = new DatabaseSync(file, { readOnly: true });
  try {
    const categories = sqlite
      .prepare("SELECT id, parent_id, name, slug, description, sort_order FROM categories")
      .all() as Array<Record<string, SqlValue>>;
    if (categories.length === 0) return;
    const products = sqlite
      .prepare(
        "SELECT id, category_id, name, slug, sku, description, unit, market_price, price, image_url, tags FROM products",
      )
      .all() as Array<Record<string, SqlValue>>;
    const users = sqlite
      .prepare("SELECT id, name, email, role, status, created_at FROM users")
      .all() as Array<Record<string, SqlValue>>;
    const sessions = sqlite
      .prepare("SELECT token, user_id, created_at FROM sessions")
      .all() as Array<Record<string, SqlValue>>;
    const hasActivity = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'activity'")
      .get();
    const activity = hasActivity
      ? (sqlite
          .prepare("SELECT id, action, kind, name, detail, actor, created_at, target_id, place_id FROM activity")
          .all() as Array<Record<string, SqlValue>>)
      : [];

    await db.collection<CategoryDoc>("categories").insertMany(
      categories.map((row) => ({
        _id: Number(row.id),
        parentId: sqliteNum(row.parent_id),
        name: sqliteText(row.name),
        slug: sqliteText(row.slug),
        description: sqliteText(row.description),
        sortOrder: Number(row.sort_order ?? 0),
      })),
    );
    if (products.length) {
      await db.collection<ProductDoc>("products").insertMany(
        products.map((row) => ({
          _id: Number(row.id),
          categoryId: Number(row.category_id),
          name: sqliteText(row.name),
          slug: sqliteText(row.slug),
          sku: sqliteText(row.sku),
          description: sqliteText(row.description),
          unit: sqliteText(row.unit),
          marketPrice: sqliteNum(row.market_price),
          price: sqliteNum(row.price),
          imageUrl: sqliteText(row.image_url),
          tags: sqliteText(row.tags),
        })),
      );
    }
    if (users.length) {
      await db.collection<UserDoc>("users").insertMany(
        users.map((row) => ({
          _id: Number(row.id),
          name: sqliteText(row.name),
          email: sqliteText(row.email).toLowerCase(),
          role: sqliteText(row.role) || "edit",
          status: sqliteText(row.status) || "active",
          createdAt: sqliteText(row.created_at),
        })),
      );
    }
    if (sessions.length) {
      await db.collection<SessionDoc>("sessions").insertMany(
        sessions.map((row) => ({
          _id: sqliteText(row.token),
          userId: Number(row.user_id),
          createdAt: sqliteText(row.created_at),
        })),
      );
    }
    if (activity.length) {
      await db.collection<ActivityDoc>("activity").insertMany(
        activity.map((row) => ({
          _id: Number(row.id),
          action: sqliteText(row.action),
          kind: sqliteText(row.kind),
          name: sqliteText(row.name),
          detail: sqliteText(row.detail),
          actor: sqliteText(row.actor),
          createdAt: sqliteText(row.created_at),
          targetId: sqliteNum(row.target_id),
          placeId: sqliteNum(row.place_id),
        })),
      );
    }
    await rememberCounter(db, "categories", categories);
    await rememberCounter(db, "products", products);
    await rememberCounter(db, "users", users);
    await rememberCounter(db, "activity", activity);
  } catch (error) {
    await db.collection("categories").deleteMany({});
    await db.collection("products").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("sessions").deleteMany({});
    await db.collection("activity").deleteMany({});
    await db.collection("counters").deleteMany({});
    throw error;
  } finally {
    sqlite.close();
  }
}

async function rememberCounter(db: Db, name: string, rows: Array<Record<string, SqlValue>>) {
  const maxId = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
  if (maxId < 1) return;
  await db.collection<CounterDoc>("counters").updateOne({ _id: name }, { $max: { seq: maxId } }, { upsert: true });
}

async function nextId(name: string) {
  const db = await database();
  const row = await db.collection<CounterDoc>("counters").findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = row && "seq" in row ? row.seq : (row as { value?: CounterDoc } | null)?.value?.seq;
  if (!seq) throw new MenuError("MongoDB id nahi ban saki.");
  return seq;
}

function mapCategory(row: CategoryDoc): Category {
  return {
    id: Number(row._id),
    parentId: row.parentId == null ? null : Number(row.parentId),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

function mapProduct(row: ProductDoc): Product {
  return {
    id: Number(row._id),
    categoryId: Number(row.categoryId),
    name: row.name,
    slug: row.slug,
    sku: row.sku ?? "",
    description: row.description ?? "",
    unit: row.unit ?? "",
    marketPrice: row.marketPrice == null ? null : Number(row.marketPrice),
    price: row.price == null ? null : Number(row.price),
    imageUrl: row.imageUrl ?? "",
    tags: row.tags ?? "",
  };
}

export function tagList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function cleanTags(value: string) {
  const tags = tagList(value);
  if (tags.length > 20) throw new MenuError("Use 20 tags or fewer.");
  return tags.join(", ");
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}

async function uniqueCategorySlug(name: string, ignoreId = -1) {
  const db = await database();
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await db.collection<CategoryDoc>("categories").findOne({ slug, _id: { $ne: ignoreId } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function uniqueProductSlug(categoryId: number, name: string, ignoreId = -1) {
  const db = await database();
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (
    await db.collection<ProductDoc>("products").findOne({
      categoryId,
      slug,
      _id: { $ne: ignoreId },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function insertCategory(parentId: number | null, name: string, description: string) {
  const db = await database();
  const last = await db
    .collection<CategoryDoc>("categories")
    .find({ parentId })
    .sort({ sortOrder: -1 })
    .limit(1)
    .next();
  const id = await nextId("categories");
  await db.collection<CategoryDoc>("categories").insertOne({
    _id: id,
    parentId,
    name,
    slug: await uniqueCategorySlug(name),
    description,
    sortOrder: Number(last?.sortOrder ?? 0) + 1,
  });
  return id;
}

async function insertProduct(input: {
  categoryId: number;
  name: string;
  sku: string;
  description: string;
  unit: string;
  marketPrice: number | null;
  price: number | null;
  imageUrl: string;
  tags: string;
}) {
  const db = await database();
  const id = await nextId("products");
  await db.collection<ProductDoc>("products").insertOne({
    _id: id,
    categoryId: input.categoryId,
    name: input.name,
    slug: await uniqueProductSlug(input.categoryId, input.name),
    sku: input.sku,
    description: input.description,
    unit: input.unit,
    marketPrice: input.marketPrice,
    price: input.price,
    imageUrl: input.imageUrl,
    tags: input.tags,
  });
  return id;
}

async function seed() {
  const grocery = await insertCategory(null, "Grocery Food", "Food and kitchen categories");
  const recipe = await insertCategory(grocery, "Recipe Ideas", "");
  const drinks = await insertCategory(recipe, "Drinks", "Cold and hot drinks");
  const snacks = await insertCategory(recipe, "Snacks", "");
  await insertProduct({
    categoryId: drinks,
    name: "Olpers Milk",
    sku: "DRK-001",
    description: "Full cream milk, 1 litre.",
    unit: "1 L",
    marketPrice: 280,
    price: 250,
    imageUrl: "",
    tags: "milk, dairy",
  });
  await insertProduct({
    categoryId: drinks,
    name: "Tapal Danedar",
    sku: "DRK-002",
    description: "Black tea pouch.",
    unit: "380 g",
    marketPrice: 620,
    price: 549,
    imageUrl: "",
    tags: "tea, hot",
  });
  await insertProduct({
    categoryId: snacks,
    name: "Lays Classic",
    sku: "SNK-001",
    description: "Salted potato chips.",
    unit: "40 g",
    marketPrice: 80,
    price: 70,
    imageUrl: "",
    tags: "chips, snack",
  });

  const household = await insertCategory(null, "Household", "Home cleaning and care");
  const cleaning = await insertCategory(household, "Cleaning", "");
  const floor = await insertCategory(cleaning, "Floor Care", "");
  await insertProduct({
    categoryId: floor,
    name: "Dettol Surface Cleaner",
    sku: "CLN-001",
    description: "Antibacterial surface cleaner.",
    unit: "500 ml",
    marketPrice: 450,
    price: 399,
    imageUrl: "",
    tags: "cleaner",
  });
}

export async function allCategories() {
  const db = await database();
  const rows = await db.collection<CategoryDoc>("categories").find().sort({ sortOrder: 1, name: 1 }).toArray();
  return rows.map(mapCategory);
}

export async function allProducts() {
  const db = await database();
  const rows = await db.collection<ProductDoc>("products").find().sort({ name: 1 }).toArray();
  return rows.map(mapProduct);
}

export async function productsInCategory(categoryId: number) {
  const db = await database();
  const rows = await db
    .collection<ProductDoc>("products")
    .find({ categoryId })
    .sort({ name: 1 })
    .toArray();
  return rows.map(mapProduct);
}

export function categoryDepth(category: Category, byId: Map<number, Category>) {
  let depth = 1;
  let parentId = category.parentId;
  while (parentId) {
    depth += 1;
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return depth;
}

async function buildMenu(): Promise<MenuData> {
  const [categories, products] = await Promise.all([allCategories(), allProducts()]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const productsByCategory = new Map<number, Product[]>();
  for (const product of products) {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategory.set(product.categoryId, list);
  }

  const childrenOf = new Map<number | null, Category[]>();
  for (const category of categories) {
    const list = childrenOf.get(category.parentId) ?? [];
    list.push(category);
    childrenOf.set(category.parentId, list);
  }

  const nodeById = new Map<number, CategoryNode>();

  function toNode(category: Category): CategoryNode {
    const children = (childrenOf.get(category.id) ?? []).map(toNode);
    const node: CategoryNode = {
      ...category,
      depth: categoryDepth(category, byId),
      productCount: productsByCategory.get(category.id)?.length ?? 0,
      insideCount: children.reduce((sum, child) => sum + 1 + child.insideCount, 0),
      children,
    };
    nodeById.set(category.id, node);
    return node;
  }

  const tree = (childrenOf.get(null) ?? []).map(toNode);
  return { categories, products, byId, productsByCategory, nodeById, tree, revision: 0 };
}

export async function loadMenu() {
  const cached = globalForDb.menuCache;
  if (cached) return cached;
  const epoch = globalForDb.menuEpoch ?? 0;
  if (!globalForDb.menuLoading) {
    globalForDb.menuLoading = buildMenu().finally(() => {
      globalForDb.menuLoading = null;
    });
  }
  const menu = await globalForDb.menuLoading;
  if ((globalForDb.menuEpoch ?? 0) !== epoch) return loadMenu();
  if (!globalForDb.menuCache || menu.revision >= globalForDb.menuCache.revision) {
    globalForDb.menuCache = menu;
  }
  return globalForDb.menuCache;
}

export function breadcrumb(categoryId: number, byId: Map<number, Category>) {
  const crumbs: Category[] = [];
  let current = byId.get(categoryId);
  while (current) {
    crumbs.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return crumbs;
}

export function levelName(depth: number) {
  if (depth <= 1) return "Category";
  if (depth === 2) return "Subcategory";
  if (depth === 3) return "Sub-subcategory";
  return `Level ${depth}`;
}

export function childLevelName(depth: number) {
  if (depth <= 0) return "Category";
  if (depth === 1) return "Subcategory";
  return "Sub-subcategory";
}

function requireName(name: string) {
  const clean = name.trim();
  if (!clean) throw new MenuError("Name is required.");
  return clean;
}

function money(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new MenuError("Price must be a number, 0 or more.");
  }
  return parsed;
}

export async function createCategory(parentId: number | null, name: string, description: string) {
  const menu = await loadMenu();
  if (parentId) {
    const parent = menu.byId.get(parentId);
    if (!parent) throw new MenuError("Parent category was not found.");
  }
  const id = await insertCategory(parentId, requireName(name), description.trim());
  await clearMenuCache();
  return id;
}

export async function updateCategory(id: number, name: string, description: string) {
  const menu = await loadMenu();
  if (!menu.byId.has(id)) throw new MenuError("Category was not found.");
  const clean = requireName(name);
  const db = await database();
  await db.collection<CategoryDoc>("categories").updateOne(
    { _id: id },
    { $set: { name: clean, slug: await uniqueCategorySlug(clean, id), description: description.trim() } },
  );
  await clearMenuCache();
}

function collectIds(id: number, childrenOf: Map<number, number[]>, into: number[]) {
  into.push(id);
  for (const child of childrenOf.get(id) ?? []) collectIds(child, childrenOf, into);
}

export async function removeCategory(id: number) {
  const menu = await loadMenu();
  const existing = menu.byId.get(id);
  if (!existing) throw new MenuError("Category was not found.");
  const childrenOf = new Map<number, number[]>();
  for (const category of menu.categories) {
    if (category.parentId == null) continue;
    const list = childrenOf.get(category.parentId) ?? [];
    list.push(category.id);
    childrenOf.set(category.parentId, list);
  }
  const ids: number[] = [];
  collectIds(id, childrenOf, ids);
  const db = await database();
  await db.collection<ProductDoc>("products").deleteMany({ categoryId: { $in: ids } });
  await db.collection<CategoryDoc>("categories").deleteMany({ _id: { $in: ids } });
  await clearMenuCache();
  return existing.parentId;
}

export async function createProduct(input: {
  categoryId: number;
  name: string;
  sku: string;
  description: string;
  unit: string;
  marketPrice: string;
  price: string;
  imageUrl: string;
  tags: string;
}) {
  const menu = await loadMenu();
  const category = menu.byId.get(input.categoryId);
  if (!category) throw new MenuError("Category was not found.");
  const id = await insertProduct({
    categoryId: input.categoryId,
    name: requireName(input.name),
    sku: input.sku.trim(),
    description: input.description.trim(),
    unit: input.unit.trim(),
    marketPrice: money(input.marketPrice),
    price: money(input.price),
    imageUrl: input.imageUrl.trim(),
    tags: cleanTags(input.tags),
  });
  await clearMenuCache();
  return id;
}

export async function updateProduct(input: {
  id: number;
  name: string;
  sku: string;
  description: string;
  unit: string;
  marketPrice: string;
  price: string;
  imageUrl: string;
  tags: string;
}) {
  const product = (await allProducts()).find((item) => item.id === input.id);
  if (!product) throw new MenuError("Product was not found.");
  const name = requireName(input.name);
  const db = await database();
  await db.collection<ProductDoc>("products").updateOne(
    { _id: product.id },
    {
      $set: {
        name,
        slug: await uniqueProductSlug(product.categoryId, name, product.id),
        sku: input.sku.trim(),
        description: input.description.trim(),
        unit: input.unit.trim(),
        marketPrice: money(input.marketPrice),
        price: money(input.price),
        imageUrl: input.imageUrl.trim(),
        tags: cleanTags(input.tags),
      },
    },
  );
  await clearMenuCache();
  return product.categoryId;
}

export async function removeProduct(id: number) {
  const product = (await allProducts()).find((item) => item.id === id);
  if (!product) throw new MenuError("Product was not found.");
  const db = await database();
  await db.collection<ProductDoc>("products").deleteOne({ _id: id });
  await clearMenuCache();
  return product.categoryId;
}

export function canEditMenu(role: UserRole) {
  return role === "admin" || role === "edit";
}

function mapRole(role: string): UserRole {
  if (role === "admin" || role === "view") return role;
  return "edit";
}

function mapUser(row: UserDoc): User {
  return {
    id: Number(row._id),
    name: row.name,
    email: row.email,
    role: mapRole(row.role),
    status: row.status === "pending" ? "pending" : "active",
    createdAt: row.createdAt,
  };
}

function userRole(role: string): UserRole {
  if (role === "view" || role === "edit") return role;
  throw new MenuError("Role Edit ya View honi chahiye.");
}

function cleanLoginName(name: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new MenuError("Name is required.");
  return clean;
}

function cleanEmail(email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new MenuError("Enter a valid email.");
  }
  return clean;
}

async function openSession(userId: number) {
  const token = crypto.randomUUID();
  const db = await database();
  await db.collection<SessionDoc>("sessions").insertOne({
    _id: token,
    userId,
    createdAt: new Date().toISOString(),
  });
  return token;
}

export async function signIn(name: string, email: string) {
  const db = await database();
  const cleanName = cleanLoginName(name);
  const clean = cleanEmail(email);
  const existing = await db.collection<UserDoc>("users").findOne({ email: clean });
  if (!existing) throw new MenuError("Yeh account nahi hai. Pehle Sign up karein.");
  if (existing.status === "pending") {
    throw new MenuError("Aap ki request abhi approval ka intezar kar rahi hai. Approve hone ke baad login hoga.");
  }
  await db.collection<UserDoc>("users").updateOne({ _id: existing._id }, { $set: { name: cleanName } });
  clearUserCache();
  return openSession(existing._id);
}

export async function requestAccount(name: string, email: string, role: string) {
  const db = await database();
  const cleanName = cleanLoginName(name);
  const clean = cleanEmail(email);
  const cleanRole = userRole(role);
  const existing = await db.collection<UserDoc>("users").findOne({ email: clean });
  if (existing && existing.status !== "pending") {
    throw new MenuError("Yeh email pehle se account hai. Login karein.");
  }
  if (existing) {
    await db.collection<UserDoc>("users").updateOne({ _id: existing._id }, { $set: { name: cleanName, role: cleanRole } });
    return;
  }
  const id = await nextId("users");
  await db.collection<UserDoc>("users").insertOne({
    _id: id,
    name: cleanName,
    email: clean,
    role: cleanRole,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

export async function listUsers() {
  const db = await database();
  const rows = await db
    .collection<UserDoc>("users")
    .find({ status: "active" })
    .collation({ locale: "en", strength: 2 })
    .sort({ name: 1 })
    .toArray();
  return rows.map(mapUser);
}

export async function listPending() {
  const db = await database();
  const rows = await db.collection<UserDoc>("users").find({ status: "pending" }).sort({ createdAt: 1 }).toArray();
  return rows.map(mapUser);
}

export async function approveUser(id: number, role: string, actorId: number) {
  if (id === actorId) throw new MenuError("Apni request yahan se approve nahi hoti.");
  const cleanRole = userRole(role);
  const db = await database();
  const existing = await db.collection<UserDoc>("users").findOne({ _id: id });
  if (!existing || existing.status !== "pending") throw new MenuError("Yeh request nahi mili.");
  await db.collection<UserDoc>("users").updateOne({ _id: id }, { $set: { role: cleanRole, status: "active" } });
  clearUserCache();
}

export async function rejectUser(id: number, actorId: number) {
  if (id === actorId) throw new MenuError("Apni request yahan se reject nahi hoti.");
  const db = await database();
  const existing = await db.collection<UserDoc>("users").findOne({ _id: id });
  if (!existing || existing.status !== "pending") throw new MenuError("Yeh request nahi mili.");
  await db.collection<SessionDoc>("sessions").deleteMany({ userId: id });
  await db.collection<UserDoc>("users").deleteOne({ _id: id });
  clearUserCache();
}

export async function setUserRole(id: number, role: string, actorId: number) {
  if (id === actorId) throw new MenuError("Apna role yahan se nahi badalta.");
  const cleanRole = userRole(role);
  const db = await database();
  const existing = await db.collection<UserDoc>("users").findOne({ _id: id });
  if (!existing || existing.status === "pending") throw new MenuError("User nahi mila.");
  if (existing.role === "admin") throw new MenuError("Admin ka role nahi badalta.");
  if (cleanRole === "view" && existing.role === "edit") {
    const total = await db.collection("users").countDocuments({ role: "edit", status: "active" });
    if (total <= 1) throw new MenuError("Kam az kam ek Edit account rehna chahiye.");
  }
  await db.collection<UserDoc>("users").updateOne({ _id: id }, { $set: { role: cleanRole } });
  clearUserCache();
}

export async function userBySession(token: string) {
  if (!token) return null;
  const cached = userCache().get(token);
  if (cached !== undefined) return cached;
  const db = await database();
  const session = await db.collection<SessionDoc>("sessions").findOne({ _id: token });
  if (!session) {
    userCache().set(token, null);
    return null;
  }
  const user = await db.collection<UserDoc>("users").findOne({ _id: session.userId, status: "active" });
  const mapped = user ? mapUser(user) : null;
  userCache().set(token, mapped);
  return mapped;
}

export async function endSession(token: string) {
  if (!token) return;
  userCache().delete(token);
  const db = await database();
  await db.collection<SessionDoc>("sessions").deleteOne({ _id: token });
}

export async function addActivity(input: {
  action: "added" | "edited" | "deleted";
  kind: "category" | "product";
  name: string;
  detail: string;
  actor: string;
  targetId: number | null;
  placeId: number | null;
}) {
  const db = await database();
  const id = await nextId("activity");
  await db.collection<ActivityDoc>("activity").insertOne({
    _id: id,
    action: input.action,
    kind: input.kind,
    name: input.name,
    detail: input.detail,
    actor: input.actor,
    createdAt: new Date().toISOString(),
    targetId: input.targetId,
    placeId: input.placeId,
  });
}

export async function recentActivity(limit = 40) {
  const db = await database();
  const rows = await db.collection<ActivityDoc>("activity").find().sort({ _id: -1 }).limit(limit).toArray();
  return rows.map(
    (item) =>
      ({
        id: Number(item._id),
        action: item.action,
        kind: item.kind,
        name: item.name,
        detail: item.detail ?? "",
        actor: item.actor ?? "",
        createdAt: item.createdAt,
        targetId: item.targetId == null ? null : Number(item.targetId),
        placeId: item.placeId == null ? null : Number(item.placeId),
      }) satisfies Activity,
  );
}

export function pkr(value: number | null) {
  if (value == null) return "—";
  return `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}
