"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, currentUser, startSession } from "@/lib/auth";
import {
  MenuError,
  addActivity,
  createCategory,
  createProduct,
  loadMenu,
  pkr,
  approveUser,
  rejectUser,
  removeCategory,
  removeProduct,
  requestAccount,
  setUserRole,
  updateCategory,
  updateProduct,
} from "@/lib/db";

async function requireEditor() {
  const user = await currentUser();
  if (!user) throw new MenuError("Login is required.");
  if (user.role !== "edit" && user.role !== "admin") {
    throw new MenuError("View account sirf dekh sakta hai. Change sirf Edit ya Admin kar sakta hai.");
  }
  return user;
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new MenuError("Login is required.");
  if (user.role !== "admin") throw new MenuError("Users page sirf admin ke liye hai.");
  return user;
}

async function actorName() {
  return (await requireEditor()).name;
}

function clip(value: string) {
  const clean = value.trim();
  if (!clean) return "khali";
  return clean.length > 80 ? `${clean.slice(0, 77)}...` : clean;
}

function priceText(value: number | null | undefined) {
  return value == null ? "" : pkr(value);
}

function formPrice(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? pkr(parsed) : value;
}

function tagsText(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}

function fieldChanges(fields: Array<[string, string, string]>) {
  return fields
    .filter(([, before, after]) => before.trim() !== after.trim())
    .map(([label, before, after]) => `${label}: ${clip(before)} → ${clip(after)}`)
    .join("\n");
}

export async function login(formData: FormData) {
  try {
    await startSession(text(formData, "name"), text(formData, "email"));
  } catch (error) {
    const message = error instanceof MenuError ? error.message : "Login failed.";
    redirect(`/login?form=login&error=${encodeURIComponent(message)}`);
  }
  redirect("/");
}

export async function signup(formData: FormData) {
  try {
    await requestAccount(text(formData, "name"), text(formData, "email"), text(formData, "role"));
  } catch (error) {
    const message = error instanceof MenuError ? error.message : "Sign up failed.";
    redirect(`/login?form=signup&error=${encodeURIComponent(message)}`);
  }
  redirect("/login?form=signup&sent=1");
}

export async function approveAccount(formData: FormData) {
  try {
    const user = await requireAdmin();
    await approveUser(Number(text(formData, "id")), text(formData, "role"), user.id);
    revalidatePath("/users");
  } catch (error) {
    if (error instanceof MenuError) {
      redirect(`/users?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/users?saved=approved");
}

export async function rejectAccount(formData: FormData) {
  try {
    const user = await requireAdmin();
    await rejectUser(Number(text(formData, "id")), user.id);
    revalidatePath("/users");
  } catch (error) {
    if (error instanceof MenuError) {
      redirect(`/users?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/users?saved=rejected");
}

export async function saveUserRole(formData: FormData) {
  try {
    const user = await requireAdmin();
    await setUserRole(Number(text(formData, "id")), text(formData, "role"), user.id);
    revalidatePath("/users");
  } catch (error) {
    if (error instanceof MenuError) {
      redirect(`/users?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/users?saved=role");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

async function note(
  action: "added" | "edited" | "deleted",
  kind: "category" | "product",
  name: string,
  detail: string,
  targetId: number | null,
  placeId: number | null,
) {
  await addActivity({
    action,
    kind,
    name: name.trim() || kind,
    detail,
    actor: await actorName(),
    targetId,
    placeId,
  });
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function go(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  redirect(query ? `/?${query}` : "/");
}

function goProducts(
  categoryId: number,
  params: Record<string, string | number | null | undefined>,
  extra = "",
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  const path = `/products/${categoryId}${extra}`;
  redirect(query ? `${path}?${query}` : path);
}

function failProduct(
  error: unknown,
  categoryId: number,
  params: Record<string, string | number | null | undefined> = {},
  extra = "",
): never {
  if (error instanceof MenuError) {
    revalidatePath("/", "layout");
    revalidatePath(`/products/${categoryId}`);
    goProducts(categoryId, { ...params, error: error.message }, extra);
  }
  throw error;
}
function fail(error: unknown, params: Record<string, string | number | null | undefined>): never {
  if (error instanceof MenuError) {
    revalidatePath("/", "layout");
    go({ ...params, error: error.message });
  }
  throw error;
}

export async function addCategory(formData: FormData) {
  const parentRaw = text(formData, "parentId").trim();
  const parentId = parentRaw ? Number(parentRaw) : null;
  try {
    await requireEditor();
    const name = text(formData, "name");
    const id = await createCategory(parentId, name, text(formData, "description"));
    const parent = parentId ? (await loadMenu()).byId.get(parentId)?.name ?? "" : "";
    await note("added", "category", name, parent, id, parentId);
    revalidatePath("/", "layout");
    go({ category: id, saved: "category" });
  } catch (error) {
    fail(error, { category: parentId });
  }
}

export async function saveCategory(formData: FormData) {
  const id = Number(text(formData, "id"));
  try {
    await requireEditor();
    const existing = (await loadMenu()).byId.get(id);
    const name = text(formData, "name");
    const description = text(formData, "description");
    await updateCategory(id, name, description);
    await note(
      "edited",
      "category",
      name,
      fieldChanges([
        ["Naam", existing?.name ?? "", name],
        ["Description", existing?.description ?? "", description],
      ]),
      id,
      id,
    );
    revalidatePath("/", "layout");
    go({ category: id, saved: "category" });
  } catch (error) {
    fail(error, { category: id });
  }
}

export async function deleteCategory(formData: FormData) {
  const id = Number(text(formData, "id"));
  try {
    await requireEditor();
    const existing = (await loadMenu()).byId.get(id);
    const parentId = await removeCategory(id);
    await note("deleted", "category", existing?.name ?? "Category", "", null, parentId);
    revalidatePath("/", "layout");
    go({ category: parentId, saved: "deleted" });
  } catch (error) {
    fail(error, { category: id });
  }
}

export async function addProduct(formData: FormData) {
  const categoryId = Number(text(formData, "categoryId"));
  try {
    await requireEditor();
    const name = text(formData, "name");
    const id = await createProduct({
      categoryId,
      name,
      sku: text(formData, "sku"),
      description: text(formData, "description"),
      unit: text(formData, "unit"),
      marketPrice: text(formData, "marketPrice"),
      price: text(formData, "price"),
      imageUrl: text(formData, "imageUrl"),
      tags: text(formData, "tags"),
    });
    await note("added", "product", name, (await loadMenu()).byId.get(categoryId)?.name ?? "", id, categoryId);
    revalidatePath("/", "layout");
    revalidatePath(`/products/${categoryId}`);
    goProducts(categoryId, { saved: "product" });
  } catch (error) {
    failProduct(error, categoryId, {}, "/new");
  }
}

export async function saveProduct(formData: FormData) {
  const id = Number(text(formData, "id"));
  const categoryId = Number(text(formData, "categoryId"));
  try {
    await requireEditor();
    const before = (await loadMenu()).products.find((item) => item.id === id);
    const name = text(formData, "name");
    const sku = text(formData, "sku");
    const description = text(formData, "description");
    const unit = text(formData, "unit");
    const marketPrice = text(formData, "marketPrice");
    const price = text(formData, "price");
    const imageUrl = text(formData, "imageUrl");
    const tags = text(formData, "tags");
    await updateProduct({ id, name, sku, description, unit, marketPrice, price, imageUrl, tags });
    await note(
      "edited",
      "product",
      name,
      fieldChanges([
        ["Naam", before?.name ?? "", name],
        ["Selling price", priceText(before?.price), formPrice(price)],
        ["Market price", priceText(before?.marketPrice), formPrice(marketPrice)],
        ["Unit", before?.unit ?? "", unit],
        ["SKU", before?.sku ?? "", sku],
        ["Tags", tagsText(before?.tags ?? ""), tagsText(tags)],
        ["Description", before?.description ?? "", description],
        ["Image", before?.imageUrl ?? "", imageUrl],
      ]),
      id,
      categoryId,
    );
    revalidatePath("/", "layout");
    revalidatePath(`/products/${categoryId}`);
    goProducts(categoryId, { saved: "product" });
  } catch (error) {
    failProduct(error, categoryId, {}, `/${id}`);
  }
}

export async function deleteProduct(formData: FormData) {
  const id = Number(text(formData, "id"));
  try {
    await requireEditor();
    const menu = await loadMenu();
    const existing = menu.products.find((item) => item.id === id);
    const categoryId = await removeProduct(id);
    await note("deleted", "product", existing?.name ?? "Product", menu.byId.get(categoryId)?.name ?? "", null, categoryId);
    revalidatePath("/", "layout");
    revalidatePath(`/products/${categoryId}`);
    goProducts(categoryId, { saved: "deleted" });
  } catch (error) {
    failProduct(error, Number(text(formData, "categoryId")), { product: id });
  }
}
