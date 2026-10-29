import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

// Recorrido completo con dos personas a la vez: el instructor publica; el estudiante
// se inscribe, aprende y reseña; el promedio llega al catalogo.
test("instructor publica, estudiante se inscribe, aprende y resena; el promedio llega al catalogo", async ({ browser }) => {
  const TITLE = `E2E Flujo ${Date.now()}`;
  const BODY = `Contenido-flujo-${Date.now()}`;

  const instructor = await (await browser.newContext()).newPage();
  instructor.on("dialog", (d) => d.accept());
  const student = await (await browser.newContext()).newPage();

  // --- Instructor: crea, estructura y publica ---
  await login(instructor, ACCOUNTS.instructorA);
  await expect(instructor).toHaveURL(/\/instructor$/);
  await instructor.goto("/instructor/cursos/nuevo");
  await instructor.getByLabel("Titulo").fill(TITLE);
  await instructor.getByLabel("Descripcion").fill("Curso creado por el test de extremo a extremo");
  await instructor.getByLabel("Categoria").selectOption({ label: "IA aplicada al marketing" });
  await instructor.getByRole("button", { name: "Crear curso" }).click();
  await expect(instructor).toHaveURL(/\/instructor\/cursos\/[0-9a-f-]{36}$/);
  const editorUrl = instructor.url();
  const courseId = editorUrl.split("/").pop()!;

  await instructor.getByLabel("Titulo de la nueva seccion").fill("Unica seccion");
  await instructor.getByRole("button", { name: "Agregar seccion" }).click();
  const section = instructor.getByTestId("section").first();
  const add = section.locator("details").filter({ has: instructor.locator("summary", { hasText: "Agregar leccion" }) });
  await add.evaluate((el: HTMLDetailsElement) => {
    el.open = true;
  });
  await add.getByLabel("Titulo de la leccion").fill("Primera leccion");
  await add.getByLabel("Contenido").fill(BODY);
  await add.getByRole("button", { name: "Agregar leccion" }).click();
  await expect(section.getByTestId("lesson")).toHaveCount(1);

  await instructor.getByRole("button", { name: "Publicar curso" }).click();
  await expect(instructor.getByText("Curso publicado.")).toBeVisible();

  try {
    // --- Estudiante: lo encuentra en el catalogo, se inscribe y aprende ---
    await login(student, ACCOUNTS.student1);
    await expect(student).toHaveURL(/\/mis-cursos$/);
    await student.goto("/cursos");
    const card = student.getByRole("listitem").filter({ hasText: TITLE });
    await expect(card.getByText("Aun sin valoraciones")).toBeVisible();
    await card.getByRole("link", { name: TITLE }).click();
    await expect(student).toHaveURL(new RegExp(`/cursos/${courseId}$`));
    expect(await student.content()).not.toContain(BODY);

    await student.getByRole("button", { name: "Inscribirme gratis" }).click();
    await expect(student).toHaveURL(new RegExp(`/aprender/${courseId}/`));
    await expect(student.getByText(BODY)).toBeVisible();

    // --- Estudiante: reseña con 4 estrellas ---
    await student.goto(`/cursos/${courseId}`);
    await student.getByLabel("Calificacion").selectOption("4");
    await student.getByLabel("Comentario (opcional)").fill("Muy claro");
    await student.getByRole("button", { name: "Publicar resena" }).click();
    await expect(student.getByRole("heading", { name: "Tu resena", exact: true })).toBeVisible();

    // --- El promedio se refleja en el catalogo (visto por un visitante anonimo) ---
    const anon = await (await browser.newContext()).newPage();
    await anon.goto("/cursos");
    const publicCard = anon.getByRole("listitem").filter({ hasText: TITLE });
    await expect(publicCard.getByText("4,0")).toBeVisible();
    await expect(publicCard.getByText("(1 resena)")).toBeVisible();

    // --- El instructor ve el inscrito en su panel ---
    await instructor.goto("/instructor");
    await expect(instructor.getByRole("listitem").filter({ hasText: TITLE }).getByText("1 inscrito")).toBeVisible();
  } finally {
    // limpieza: borrar el curso elimina inscripcion y resena en cascada
    await instructor.goto(editorUrl);
    await instructor.getByRole("button", { name: "Eliminar curso" }).click();
    await expect(instructor).toHaveURL(/\/instructor$/);
  }
});
