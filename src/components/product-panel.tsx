import Link from "next/link";
import { deleteCategory, deleteProduct, saveCategory, saveProduct } from "@/app/actions";
import { ChangeNote, noteView, notesForPage } from "@/components/activity-list";
import { EditableName } from "@/components/editable-name";
import { btn, btnQuiet } from "@/components/ui";
import { breadcrumb, pkr, tagList, type Category, type Product } from "@/lib/db";

function Banner({ error, saved }: { error: string; saved: string }) {
  if (error) {
    return <p className="mb-4 rounded-lg border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-sm text-[#c62828]">{error}</p>;
  }
  if (saved === "product") {
    return <p className="mb-4 rounded-lg border border-[#c9e8d4] bg-[#f3fbf6] px-4 py-3 text-sm text-[#1b7a3a]">Product add ho gaya. Neeche list mein dikh raha hai.</p>;
  }
  if (saved === "deleted") {
    return <p className="mb-4 rounded-lg border border-[#c9e8d4] bg-[#f3fbf6] px-4 py-3 text-sm text-[#1b7a3a]">Product delete ho gaya.</p>;
  }
  return null;
}

export async function ProductPanel({
  category,
  byId,
  products,
  error,
  saved,
  canEdit,
}: {
  category: Category;
  byId: Map<number, Category>;
  products: Product[];
  error: string;
  saved: string;
  canEdit: boolean;
}) {
  const crumbs = breadcrumb(category.id, byId);
  const notes = await notesForPage();

  return (
    <section>
      <Banner error={error} saved={saved} />
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#5d6880]">
        <Link href="/" className="hover:text-[#1c2c86]">All</Link>
        {crumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <span>/</span>
            <Link href={`/?category=${crumb.id}`} className="hover:text-[#1c2c86]">{crumb.name}</Link>
          </span>
        ))}
      </nav>
      <p className="text-xs font-medium tracking-wide text-[#5d6880] uppercase">Product list</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <EditableName
            action={saveCategory}
            name={category.name}
            hidden={{ id: String(category.id), description: category.description }}
            note={noteView(notes.on(category.id, "category"))}
            className="text-2xl font-medium text-[#1c2c86]"
            canEdit={canEdit}
            remove={{ action: deleteCategory, id: category.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
          />
          <p className="mt-1 text-sm text-[#5d6880]">
            {products.length} {products.length === 1 ? "product" : "products"} added
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/?category=${category.id}`} className={btnQuiet}>Back to categories</Link>
          {canEdit ? <Link href={`/products/${category.id}/new`} className={btn}>Add product</Link> : null}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[#e3e6ef] bg-white px-5 py-10 text-center">
          <p className="text-base font-medium">Abhi koi product add nahi hua</p>
          <p className="mt-1 text-sm text-[#5d6880]">
            {canEdit ? "Add product dabao. Jo product save hoga woh isi list mein dikhega." : "Is category mein abhi koi product nahi hai."}
          </p>
          {canEdit ? <Link href={`/products/${category.id}/new`} className={`${btn} mt-4`}>Add product</Link> : null}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-[#e3e6ef] bg-white">
          <div className="hidden grid-cols-[minmax(0,1.7fr)_8rem_minmax(0,1fr)_7rem_3.5rem] items-center gap-3 border-b border-[#e3e6ef] bg-[#f7f8fc] px-3 py-2 text-xs font-medium tracking-wide text-[#5d6880] uppercase lg:grid">
            <span>Name</span>
            <span>SKU</span>
            <span>Tags</span>
            <span className="text-right">Price</span>
            <span />
          </div>
          <ul>
            {products.map((product) => {
              const tags = tagList(product.tags);
              return (
                <li
                  key={product.id}
                  className="grid grid-cols-1 items-center gap-x-3 gap-y-1 border-b border-[#eef1f6] px-3 py-1.5 last:border-b-0 lg:grid-cols-[minmax(0,1.7fr)_8rem_minmax(0,1fr)_7rem_3.5rem]"
                >
                  <EditableName
                    action={saveProduct}
                    name={product.name}
                    hidden={{
                      id: String(product.id),
                      categoryId: String(product.categoryId),
                      sku: product.sku,
                      description: product.description,
                      unit: product.unit,
                      marketPrice: product.marketPrice == null ? "" : String(product.marketPrice),
                      price: product.price == null ? "" : String(product.price),
                      imageUrl: product.imageUrl,
                      tags: product.tags,
                    }}
                    note={noteView(notes.on(product.id, "product"))}
                      className="truncate text-sm font-medium"
                      canEdit={canEdit}
                      remove={{ action: deleteProduct, id: product.id, categoryId: product.categoryId, confirm: "Is product ko delete karun?" }}
                    />
                  <p className="truncate text-xs text-[#5d6880]">
                    {[product.sku || "No SKU", product.unit].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex min-w-0 flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#e8ebf7] px-2 py-0.5 text-[11px] font-medium text-[#1c2c86]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm lg:text-right">
                    {product.marketPrice != null ? (
                      <span className="mr-2 text-xs text-[#8a90a5] line-through">{pkr(product.marketPrice)}</span>
                    ) : null}
                    <span className="font-medium text-[#1c2c86]">{pkr(product.price)}</span>
                  </div>
                  <Link href={`/products/${category.id}/${product.id}`} className="text-xs font-medium text-[#1c2c86] hover:underline lg:text-right">
                    {canEdit ? "Edit" : "View"}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <ChangeNote item={notes.removed(category.id, "product")} />
    </section>
  );
}
