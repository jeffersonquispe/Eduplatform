import { CourseGridSkeleton } from "@/components/course-card";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <span className="eb-skel h-8 w-48" aria-hidden="true" />
      <div className="mt-6">
        <CourseGridSkeleton />
      </div>
    </main>
  );
}
