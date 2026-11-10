// Los cursos no tienen imagen propia en la base de datos: esta ilustracion generica
// se deriva de la categoria (o del id si no tiene) para que cada curso se vea distinto
// pero estable entre renders, sin depender de un asset remoto ni de next/image.
const GRADIENTS: [string, string][] = [
  ["#1d4e89", "#14939f"], // navy-700 -> teal-500
  ["#2a62a6", "#0e7c86"], // navy-600 -> teal-600
  ["#163a63", "#14939f"], // navy-800 -> teal-500
  ["#334155", "#0e7c86"], // slate-700 -> teal-600
  ["#0f2a4a", "#2a62a6"], // navy-900 -> navy-600
];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function coursePlaceholder(seed: string) {
  const h = hash(seed);
  const [from, to] = GRADIENTS[h % GRADIENTS.length];
  const initial = seed.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
</linearGradient></defs>
<rect width="400" height="160" fill="url(#g)"/>
<text x="20" y="112" font-family="system-ui, sans-serif" font-size="88" font-weight="600" fill="#ffffff" opacity="0.35">${initial}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
