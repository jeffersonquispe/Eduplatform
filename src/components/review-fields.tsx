const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function ReviewFields({ defaults }: { defaults?: { rating: number; comment: string | null } }) {
  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span>Calificacion</span>
        <select name="rating" required defaultValue={defaults?.rating ?? ""} className={`${inputClass} w-40`}>
          <option value="" disabled>
            Elige…
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Comentario (opcional)</span>
        <textarea name="comment" rows={3} maxLength={2000} defaultValue={defaults?.comment ?? ""} className={inputClass} />
      </label>
    </div>
  );
}
