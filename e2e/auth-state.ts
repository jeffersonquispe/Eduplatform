import path from "node:path";

// Sesiones guardadas por e2e/auth.setup.ts (carpeta en .gitignore: contienen cookies de sesion).
// Uso en una spec:  test.use({ storageState: AUTH_STATE.instructor });
const dir = path.join(__dirname, "..", "playwright", ".auth");
export const AUTH_STATE = {
  instructor: path.join(dir, "instructor.json"),
  student: path.join(dir, "student.json"),
};
