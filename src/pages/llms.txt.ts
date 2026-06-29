import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { praxis } from '../data/site';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('ratgeber')).sort((a, b) => +b.data.date - +a.data.date);
  const pages = await getCollection('pages');
  const leistungen = pages
    .filter((p) => p.data.path.startsWith('/leistungen'))
    .sort((a, b) => a.data.path.localeCompare(b.data.path));
  const u = praxis.url;

  const lines = [
    `# ${praxis.name}`,
    '',
    `> Familienzahnarztpraxis in ${praxis.city} (Nordrhein-Westfalen). Schwerpunkte: Familienzahnmedizin, einfühlsame Behandlung von Angstpatienten, Prophylaxe, Zahnersatz & Implantate, Kinderzahnmedizin. Gesetzliche & private Kassen. Seit 1981.`,
    '',
    '## Kontakt & Praxis',
    `- Adresse: ${praxis.street}, ${praxis.zip} ${praxis.city}`,
    `- Telefon: ${praxis.phone} · Notdienst: ${praxis.emergency}`,
    `- E-Mail: ${praxis.email}`,
    `- Öffnungszeiten: Mo, Di, Do 08:00–18:30 · Mi, Fr 08:00–13:00`,
    `- Bewertung: ${praxis.rating.valueDe}/5 aus ${praxis.rating.count} Google-Bewertungen`,
    `- [Termin anfragen](${u}/terminanfrage) · [Kontakt](${u}/kontakt) · [Praxisteam](${u}/praxisteam)`,
    '',
    '## Leistungen',
    ...leistungen.map((p) => `- [${p.data.title}](${u}${p.data.path})`),
    '',
    '## Ratgeber (Patientenwissen)',
    ...posts.map((p) => `- [${p.data.title}](${u}/ratgeber/${p.id})`),
    '',
    '## Agent-Tools (WebMCP)',
    '- search_site — Sucht auf der Website nach einem Stichwort und liefert bis zu zehn passende Seiten mit Titel, URL und Kurztext.',
    '- get_appointment_info — Liefert Kontaktdaten, Öffnungszeiten und die URL zur Terminanfrage.',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
