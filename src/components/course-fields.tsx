const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

type Props = {
  categories: { id: string; name: string }[];
  defaults?: { title: string; description: string; category_id: string | null };
};

export function CourseFields({ categories, defaults }: Props) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span>Titulo</span>
        <input name="title" required maxLength={200} defaultValue={defaults?.title} className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Descripcion</span>
        <textarea name="description" rows={5} defaultValue={defaults?.description} className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Categoria</span>
        <select name="category_id" defaultValue={defaults?.category_id ?? ""} className={inputClass}>
          <option value="">Sin categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
