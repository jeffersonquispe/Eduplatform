import { inputClass } from "@/components/ui";

type Props = {
  categories: { id: string; name: string }[];
  defaults?: { title: string; description: string; category_id: string | null };
};

export function CourseFields({ categories, defaults }: Props) {
  return (
    <div className="space-y-4">
      <label className="eb-label">
        <span>Titulo</span>
        <input name="title" required maxLength={200} defaultValue={defaults?.title} className={inputClass} />
      </label>
      <label className="eb-label">
        <span>Descripcion</span>
        <textarea name="description" rows={5} defaultValue={defaults?.description} className={inputClass} />
      </label>
      <label className="eb-label">
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
