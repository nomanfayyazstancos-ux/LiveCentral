import Link from "next/link";
import { addCategory, deleteCategory, deleteProduct, saveCategory, saveProduct } from "@/app/actions";
import { ChangeNote, noteView, notesForPage } from "@/components/activity-list";
import { EditableName } from "@/components/editable-name";
import { btn, field } from "@/components/ui";
import {
  breadcrumb,
  levelName,
  type Category,
  type CategoryNode,
  type Product,
} from "@/lib/db";

function Banner({ error, saved }: { error: string; saved: string }) {
  if (error) {
    return (
      <p className="mb-4 rounded-lg border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-sm text-[#c62828]">
        {error}
      </p>
    );
  }
  if (!saved) return null;
  const message =
    saved === "product" ? "Product saved." : saved === "deleted" ? "Deleted." : "Category saved.";
  return (
    <p className="mb-4 rounded-lg border border-[#c9e8d4] bg-[#f3fbf6] px-4 py-3 text-sm text-[#1b7a3a]">
      {message}
    </p>
  );
}

function CategoryForm({
  parentId,
  heading,
  help,
  submitLabel,
}: {
  parentId: number | null;
  heading: string;
  help: string;
  submitLabel: string;
}) {
  return (
    <form action={addCategory} className="rounded-2xl border border-[#e3e6ef] bg-white p-5">
      <h3 className="text-lg font-medium text-[#1c2c86]">{heading}</h3>
      <p className="mt-1 text-sm leading-6 text-[#5d6880]">{help}</p>
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <label className="mt-4 block text-sm font-medium text-[#1a1a1a]">
        Category ka naam
        <input name="name" required placeholder="Jaise Cold Drinks" className={`${field} mt-1`} />
      </label>
      <button type="submit" className={`${btn} mt-4`}>{submitLabel}</button>
    </form>
  );
}

export async function CategoryPanel({
  tree,
  byId,
  nodeById,
  productsByCategory,
  categoryId,
  error,
  saved,
  query,
  canEdit,
}: {
  tree: CategoryNode[];
  byId: Map<number, Category>;
  nodeById: Map<number, CategoryNode>;
  productsByCategory: Map<number, Product[]>;
  categoryId: number | null;
  error: string;
  saved: string;
  query: string;
  canEdit: boolean;
}) {
  const notes = await notesForPage();
  if (query) {
    const needle = query.toLowerCase();
    const categories = [...byId.values()].filter((item) => item.name.toLowerCase().includes(needle));
    const products = [...productsByCategory.values()]
      .flat()
      .filter(
        (item) =>
          item.name.toLowerCase().includes(needle) ||
          item.sku.toLowerCase().includes(needle) ||
          item.tags.toLowerCase().includes(needle),
      );
    return (
      <section>
        <Banner error={error} saved={saved} />
        <h2 className="text-2xl font-medium text-[#1c2c86]">Search: {query}</h2>
        <div className="mt-5 grid gap-3">
          {categories.slice(0, 40).map((item) => {
            const path = breadcrumb(item.id, byId).map((crumb) => crumb.name).join(" / ");
            return (
              <div key={item.id} className="rounded-xl border border-[#e3e6ef] bg-white px-4 py-3">
                <span className="text-xs text-[#5d6880]">{levelName(breadcrumb(item.id, byId).length)}</span>
                <span className="mt-1 block">
                  <EditableName
                    action={saveCategory}
                    name={item.name}
                    hidden={{ id: String(item.id), description: item.description }}
                    note={noteView(notes.on(item.id, "category"))}
                    href={`/?category=${item.id}`}
                    canEdit={canEdit}
                    remove={{ action: deleteCategory, id: item.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
                  />
                </span>
                <Link href={`/?category=${item.id}`} className="mt-1 block text-sm text-[#1c2c86]">{path}</Link>
              </div>
            );
          })}
          {products.slice(0, 20).map((item) => {
            const path = breadcrumb(item.categoryId, byId).map((crumb) => crumb.name).join(" / ");
            return (
              <div key={item.id} className="rounded-xl border border-[#e3e6ef] bg-white px-4 py-3">
                <span className="text-xs text-[#5d6880]">Product · {item.sku || "No SKU"}</span>
                <span className="mt-1 block">
                  <EditableName
                    action={saveProduct}
                    name={item.name}
                    hidden={{
                      id: String(item.id),
                      categoryId: String(item.categoryId),
                      sku: item.sku,
                      description: item.description,
                      unit: item.unit,
                      marketPrice: item.marketPrice == null ? "" : String(item.marketPrice),
                      price: item.price == null ? "" : String(item.price),
                      imageUrl: item.imageUrl,
                      tags: item.tags,
                    }}
                    note={noteView(notes.on(item.id, "product"))}
                    href={`/products/${item.categoryId}/${item.id}`}
                    canEdit={canEdit}
                    remove={{ action: deleteProduct, id: item.id, categoryId: item.categoryId, confirm: "Is product ko delete karun?" }}
                  />
                </span>
                <Link href={`/products/${item.categoryId}/${item.id}`} className="mt-1 block text-sm text-[#1c2c86]">{path}</Link>
              </div>
            );
          })}
          {categories.length === 0 && products.length === 0 ? (
            <p className="text-sm text-[#5d6880]">Nothing matched.</p>
          ) : null}
          {categories.length > 40 ? (
            <p className="text-sm text-[#5d6880]">Showing the first 40 categories. Type a longer name to narrow it.</p>
          ) : null}
        </div>
      </section>
    );
  }

  if (!categoryId) {
    return (
      <section>
        <Banner error={error} saved={saved} />
        <h2 className="text-2xl font-medium text-[#1c2c86]">All departments</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6880]">
          Left side se category kholen. Product list alag page par sirf added products dikhati hai.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tree.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#e3e6ef] bg-white p-4 hover:border-[#1c2c86]">
              <span className="text-xs text-[#5d6880]">Department</span>
              <span className="mt-1 block">
                <EditableName
                  action={saveCategory}
                  name={item.name}
                  hidden={{ id: String(item.id), description: item.description }}
                  note={noteView(notes.on(item.id, "category"))}
                  href={`/?category=${item.id}`}
                  className="text-lg font-medium"
                  canEdit={canEdit}
                  remove={{ action: deleteCategory, id: item.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
                />
              </span>
              <Link href={`/?category=${item.id}`} className="mt-2 block text-sm text-[#5d6880]">{item.insideCount} categories inside</Link>
            </div>
          ))}
        </div>
        {canEdit ? (
          <div className="mt-6">
            <CategoryForm
              parentId={null}
              heading="Nayi category add karo"
              help="Yeh sab se upar ki category banegi, jaise Grocery ya Household. Naam likho aur button dabao."
              submitLabel="Add category"
            />
          </div>
        ) : null}
      </section>
    );
  }

  const category = byId.get(categoryId);
  if (!category) {
    return <p className="text-sm text-[#5d6880]">This category does not exist.</p>;
  }

  const crumbs = breadcrumb(category.id, byId);
  const depth = crumbs.length;
  const current = nodeById.get(category.id);
  const children = current?.children ?? [];
  const productCount = productsByCategory.get(category.id)?.length ?? 0;

  return (
    <section>
      <Banner error={error} saved={saved} />
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#5d6880]">
        <Link href="/" className="hover:text-[#1c2c86]">All</Link>
        {crumbs.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <span>/</span>
            {index === crumbs.length - 1 ? (
              <span className="font-medium text-[#1a1a1a]">{crumb.name}</span>
            ) : (
              <Link href={`/?category=${crumb.id}`} className="hover:text-[#1c2c86]">{crumb.name}</Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#5d6880] uppercase">{levelName(depth)}</p>
          <div className="mt-1">
            <EditableName
              action={saveCategory}
              name={category.name}
              hidden={{ id: String(category.id), description: category.description }}
              note={noteView(notes.on(category.id, "category"))}
              className="text-2xl font-medium text-[#1c2c86]"
              canEdit={canEdit}
              remove={{ action: deleteCategory, id: category.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
            />
          </div>
          {category.description && category.description !== category.name ? (
            <p className="mt-1 text-sm text-[#5d6880]">Collection name: {category.description}</p>
          ) : null}
        </div>
        <Link href={`/products/${category.id}`} className={btn}>
          Product list ({productCount})
        </Link>
      </div>
      <p className="mt-3 text-sm text-[#5d6880]">{children.length} categories inside this one</p>

      <div className="mt-5">
        <h3 className="text-lg font-medium">Inside {category.name}</h3>
        {children.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-[#e3e6ef] bg-white px-4 py-6 text-sm text-[#5d6880]">
            Is ke andar aur koi category nahi. Added products dekhne ke liye upar Product list dabao.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => (
              <div key={child.id} className="rounded-xl border border-[#e3e6ef] bg-white px-4 py-3 hover:border-[#1c2c86]">
                <span className="text-xs text-[#5d6880]">{levelName(depth + 1)}</span>
                <span className="mt-1 block">
                  <EditableName
                    action={saveCategory}
                    name={child.name}
                    hidden={{ id: String(child.id), description: child.description }}
                    note={noteView(notes.on(child.id, "category"))}
                    href={child.children.length > 0 ? `/?category=${child.id}` : `/products/${child.id}`}
                    canEdit={canEdit}
                    remove={{ action: deleteCategory, id: child.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
                  />
                </span>
                {child.description && child.description !== child.name ? (
                  <span className="mt-1 block text-xs text-[#5d6880]">{child.description}</span>
                ) : null}
                <Link
                  href={child.children.length > 0 ? `/?category=${child.id}` : `/products/${child.id}`}
                  className="mt-2 block text-sm text-[#5d6880]"
                >
                  {child.children.length > 0
                    ? `${child.children.length} categories inside`
                    : `${child.productCount} products added`}
                </Link>
              </div>
            ))}
          </div>
        )}
        <ChangeNote item={notes.removed(category.id, "category")} />
      </div>

      {canEdit ? (
        <div className="mt-8 max-w-xl">
          <CategoryForm
            parentId={category.id}
            heading="Nayi category add karo"
            help={`${category.name} ke andar nayi category chahiye? Naam likho aur Add category dabao. Woh upar wali list mein aa jayegi.`}
            submitLabel="Add category"
          />
        </div>
      ) : null}
    </section>
  );
}
