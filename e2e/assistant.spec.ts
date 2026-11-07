import { expect, test, type Frame, type Page } from "@playwright/test";

const EDY = "http://edy.test";
const WIDGET_URL = `${EDY}/widget/`;

// Sustituye a la pagina real del widget: responde al saludo y guarda lo que recibe de la plataforma.
const STUB_WIDGET = `<!doctype html><html lang="es"><body>
<label>Mensaje <input id="draft" /></label>
<script>
  window.received = [];
  addEventListener("message", (event) => {
    window.received.push(event.data.type);
    if (event.data.type === "edy:init") parent.postMessage({ type: "edy:ready" }, event.origin);
    if (event.data.type === "edy:focus") document.getElementById("draft").focus();
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") parent.postMessage({ type: "edy:close" }, "*");
  });
</script></body></html>`;

function stubWidget(page: Page) {
  const requests: string[] = [];
  return page
    .route(`${EDY}/**`, (route) => {
      requests.push(route.request().url());
      return route.fulfill({ contentType: "text/html", body: STUB_WIDGET });
    })
    .then(() => requests);
}

const launcher = (page: Page) => page.getByRole("button", { name: "Asistente", exact: true });
const panel = (page: Page) => page.getByRole("dialog", { name: "Asistente" });
const closeButton = (page: Page) => page.getByRole("button", { name: "Cerrar asistente" });

async function openPanel(page: Page): Promise<Frame> {
  await launcher(page).click();
  await expect(page.getByTitle("Asistente de cursos EduTech")).toBeVisible();
  const frame = page.frame({ url: WIDGET_URL });
  if (!frame) throw new Error("El iframe del asistente no cargo");
  return frame;
}

const received = (frame: Frame) => frame.evaluate(() => (window as unknown as { received: string[] }).received);

test("no pide nada a Edy hasta abrir el panel y entonces carga el iframe", async ({ page }) => {
  const requests = await stubWidget(page);
  await page.goto("/cursos");
  await expect(launcher(page)).toBeVisible();
  await page.goto("/");
  await expect(launcher(page)).toBeVisible();
  expect(requests).toEqual([]);

  await openPanel(page);
  expect(requests).toEqual([WIDGET_URL]);

  const iframe = page.getByTitle("Asistente de cursos EduTech");
  await expect(iframe).toHaveAttribute("allow", "microphone; autoplay");
  await expect(iframe).toHaveAttribute("src", WIDGET_URL);
});

test("conserva la conversacion al cerrar, reabrir y navegar sin recargar", async ({ page }) => {
  const requests = await stubWidget(page);
  await page.goto("/cursos");
  const frame = await openPanel(page);
  await frame.locator("#draft").fill("mi pregunta");

  await closeButton(page).click();
  await expect(panel(page)).toBeHidden();
  await launcher(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(frame.locator("#draft")).toHaveValue("mi pregunta");

  await frame.evaluate(() => parent.postMessage({ type: "edy:navigate", path: "/registro" }, "*"));
  await expect(page).toHaveURL(/\/registro$/);
  await expect(panel(page)).toBeVisible();
  await expect(frame.locator("#draft")).toHaveValue("mi pregunta");
  expect(requests).toEqual([WIDGET_URL]);
});

test("ignora mensajes de otro origen y rutas no permitidas", async ({ page }) => {
  await stubWidget(page);
  await page.goto("/cursos");
  const frame = await openPanel(page);

  // Misma forma de mensaje, pero enviado por la propia pagina: no viene del origen del asistente.
  await page.evaluate(() => {
    window.postMessage({ type: "edy:navigate", path: "/login" }, "*");
    window.postMessage({ type: "edy:close" }, "*");
  });

  for (const path of ["https://malo.example/", "//malo.example", "/instructor", "/cursos/no-es-uuid", "/login?next=//malo.example"]) {
    await frame.evaluate((p) => parent.postMessage({ type: "edy:navigate", path: p }, "*"), path);
  }

  // Un viaje de ida y vuelta confirma que la plataforma ya proceso los mensajes anteriores.
  await frame.evaluate(() => parent.postMessage({ type: "edy:ready" }, "*"));
  await expect(panel(page)).toBeVisible();
  await expect(page).toHaveURL(/\/cursos$/);
});

test("Escape y el boton cierran el panel y devuelven el foco, sin bloquear la pagina", async ({ page }) => {
  await stubWidget(page);
  await page.goto("/cursos");
  const frame = await openPanel(page);

  await expect(frame.locator("#draft")).toBeFocused();
  await expect(page.getByRole("searchbox", { name: "Buscar cursos" })).toBeEnabled();
  await page.getByRole("searchbox", { name: "Buscar cursos" }).fill("seo");
  await expect(panel(page)).toBeVisible();

  await frame.locator("#draft").focus();
  await frame.locator("#draft").press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(launcher(page)).toBeFocused();
  await expect.poll(() => received(frame)).toContain("edy:hidden");

  await launcher(page).click();
  await expect(panel(page)).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar cursos" }).focus();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(launcher(page)).toBeFocused();

  await launcher(page).click();
  await closeButton(page).click();
  await expect(panel(page)).toBeHidden();
  await expect(launcher(page)).toBeFocused();
});

test("muestra un error si el asistente no confirma y permite reintentar", async ({ page }) => {
  let healthy = false;
  await page.route(`${EDY}/**`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: healthy ? STUB_WIDGET : "<!doctype html><title>caido</title>",
    }),
  );
  await page.goto("/cursos");
  await launcher(page).click();
  await expect(page.getByText("Cargando asistente...")).toBeVisible();
  const unavailable = page.getByText("El asistente no esta disponible ahora");
  await expect(unavailable).toBeVisible({ timeout: 15_000 });

  healthy = true;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByTitle("Asistente de cursos EduTech")).toBeVisible();
  await expect(unavailable).toHaveCount(0);

  await closeButton(page).click();
  await expect(panel(page)).toBeHidden();
});

test("se oculta bajo /aprender y termina la voz si se navega hasta ahi", async ({ page }) => {
  await stubWidget(page);
  await page.goto("/cursos");
  const frame = await openPanel(page);

  // usePathname sigue a pushState: asi se prueba la ruta sin depender de una sesion ni de un curso.
  await page.evaluate(() => window.history.pushState(null, "", "/aprender/curso/leccion"));
  await expect(launcher(page)).toHaveCount(0);
  await expect(panel(page)).toBeHidden();
  await expect.poll(() => received(frame)).toContain("edy:hidden");

  await page.evaluate(() => window.history.pushState(null, "", "/cursos"));
  await expect(launcher(page)).toBeVisible();
});

test.describe("en un telefono", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("ocupa toda la ventana, sin desplazamiento y con controles de 44 px", async ({ page }) => {
    await stubWidget(page);
    await page.goto("/cursos");
    await launcher(page).tap();
    await expect(page.getByTitle("Asistente de cursos EduTech")).toBeVisible();

    expect(await panel(page).boundingBox()).toEqual({ x: 0, y: 0, width: 375, height: 667 });
    const close = await closeButton(page).boundingBox();
    expect(close?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // A pantalla completa la navegacion cierra el panel para que se vea la pagina de destino.
    const frame = page.frame({ url: WIDGET_URL })!;
    await frame.evaluate(() => parent.postMessage({ type: "edy:navigate", path: "/registro" }, "*"));
    await expect(page).toHaveURL(/\/registro$/);
    await expect(panel(page)).toBeHidden();
  });
});

test("en escritorio es una ventana lateral bajo la cabecera y se adapta a la altura", async ({ page }) => {
  await stubWidget(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/cursos");
  await openPanel(page);
  const box = await panel(page).boundingBox();
  expect(box).toEqual({ x: 864, y: 57, width: 400, height: 671 });

  await page.setViewportSize({ width: 1280, height: 500 });
  const low = await panel(page).boundingBox();
  expect(low?.height).toBe(371);
  await expect(closeButton(page)).toBeInViewport();
});
