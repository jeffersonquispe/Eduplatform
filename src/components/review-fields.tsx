import { inputClass } from "@/components/ui";

export function ReviewFields({ defaults }: { defaults?: { rating: number; comment: string | null } }) {
  return (
    <div className="space-y-3">
      <label className="eb-label">
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
      <label className="eb-label">
        <span>Comentario (opcional)</span>
        <textarea name="comment" rows={3} maxLength={2000} defaultValue={defaults?.comment ?? ""} className={inputClass} />
      </label>
    </div>
  );
}
