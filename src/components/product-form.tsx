import Link from "next/link";
import { addProduct, deleteCategory, deleteProduct, saveCategory, saveProduct } from "@/app/actions";
import { noteView, notesForPage } from "@/components/activity-list";
import { EditableName } from "@/components/editable-name";
import { btn, btnQuiet, field } from "@/components/ui";
import { breadcrumb, pkr, type Category, type Product } from "@/lib/db";

export async function ProductForm({
  category,
  byId,
  product,
  error,
  canEdit,
}: {
  category: Category;
  byId: Map<number, Category>;
  product: Product | null;
  error: string;
  canEdit: boolean;
}) {
  const crumbs = breadcrumb(category.id, byId);
  const editing = product != null;
  const notes = await notesForPage();

  return (
    <section>
      {error ? (
        <p className="mb-4 rounded-lg border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-sm text-[#c62828]">{error}</p>
      ) : null}
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#5d6880]">
        <Link href="/" className="hover:text-[#1c2c86]">All</Link>
        {crumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <span>/</span>
            <Link href={`/?category=${crumb.id}`} className="hover:text-[#1c2c86]">{crumb.name}</Link>
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#5d6880] uppercase">
            {editing ? (canEdit ? "Edit product" : "View product") : "Add product"}
          </p>
          <div className="mt-1">
            {product ? (
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
                className="text-2xl font-medium text-[#1c2c86]"
                canEdit={canEdit}
                remove={{ action: deleteProduct, id: product.id, categoryId: category.id, confirm: "Is product ko delete karun?" }}
              />
            ) : (
              <EditableName
                action={saveCategory}
                name={category.name}
                hidden={{ id: String(category.id), description: category.description }}
                note={noteView(notes.on(category.id, "category"))}
                className="text-2xl font-medium text-[#1c2c86]"
                canEdit={canEdit}
                remove={{ action: deleteCategory, id: category.id, confirm: "Is category ko aur uske andar ki sab cheezein delete karun?" }}
              />
            )}
          </div>
        </div>
        <Link href={`/products/${category.id}`} className={btnQuiet}>Back to product list</Link>
      </div>

      {!canEdit && !editing ? (
        <p className="mt-5 rounded-2xl border border-[#e3e6ef] bg-white px-5 py-8 text-sm text-[#5d6880]">
          View account naya product add nahi kar sakta. Sirf Edit role add kar sakti hai.
        </p>
      ) : !canEdit && product ? (
        <dl className="mt-5 grid gap-3 rounded-2xl border border-[#e3e6ef] bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#5d6880]">Product name</dt>
            <dd className="text-sm">{product.name}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#5d6880]">Tags</dt>
            <dd className="text-sm">{product.tags || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5d6880]">Selling price</dt>
            <dd className="text-sm">{pkr(product.price)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5d6880]">Market price</dt>
            <dd className="text-sm">{pkr(product.marketPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5d6880]">Unit</dt>
            <dd className="text-sm">{product.unit || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#5d6880]">SKU</dt>
            <dd className="text-sm">{product.sku || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#5d6880]">Description</dt>
            <dd className="text-sm">{product.description || "—"}</dd>
          </div>
        </dl>
      ) : (
      <form action={editing ? saveProduct : addProduct} className="mt-5 rounded-2xl border border-[#e3e6ef] bg-white p-5">
        <input type="hidden" name="categoryId" value={category.id} />
        {editing ? <input type="hidden" name="id" value={product.id} /> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-[#5d6880] sm:col-span-2">
            Product name
            <input name="name" required defaultValue={product?.name} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880] sm:col-span-2">
            Tags
            <input
              name="tags"
              defaultValue={product?.tags}
              placeholder="cold, fizzy, family pack"
              className={`${field} mt-1`}
            />
            <span className="mt-1 block text-xs text-[#5d6880]">Comma se alag likho. Yeh tags product list pe chips ki tarah dikhengi.</span>
          </label>
          <label className="block text-sm text-[#5d6880]">
            Selling price
            <input name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ""} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880]">
            Market price
            <input name="marketPrice" type="number" min="0" step="0.01" defaultValue={product?.marketPrice ?? ""} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880]">
            Unit
            <input name="unit" defaultValue={product?.unit} placeholder="1 kg, 500 ml" className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880]">
            SKU
            <input name="sku" defaultValue={product?.sku} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880] sm:col-span-2">
            Description
            <textarea name="description" rows={3} defaultValue={product?.description} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-[#5d6880] sm:col-span-2">
            Image URL
            <input name="imageUrl" defaultValue={product?.imageUrl} className={`${field} mt-1`} />
          </label>
        </div>
        <button type="submit" className={`${btn} mt-4`}>{editing ? "Save product" : "Add product"}</button>
      </form>
      )}
    </section>
  );
}
