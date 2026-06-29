import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Static search index for the WebMCP search_site tool + on-site search.
export const GET: APIRoute = async () => {
  const posts = await getCollection('ratgeber');
  const pages = await getCollection('pages');
  const results = [
    { title: 'Zahnarztpraxis Dr. Natalia Ehrlichmann', url: '/', excerpt: 'Familienzahnarztpraxis in Neunkirchen-Seelscheid: Prophylaxe, Zahnersatz, Implantate, Kinderzahnmedizin und einfühlsame Behandlung von Angstpatienten.', type: 'Seite' },
    ...posts.map((p) => ({ title: p.data.title, url: `/ratgeber/${p.id}`, excerpt: p.data.description, type: 'Ratgeber' })),
    ...pages
      .filter((p) => p.data.path !== '/ratgeber' && !p.data.path.startsWith('/ihre-zahngesundheit-testergebins-'))
      .map((p) => ({ title: p.data.title, url: p.data.path, excerpt: p.data.description ?? '', type: 'Seite' })),
    { title: 'Terminanfrage', url: '/terminanfrage', excerpt: 'Online einen Termin in der Praxis anfragen.', type: 'Seite' },
    { title: 'Kontakt', url: '/kontakt', excerpt: 'Kontaktformular, Telefon, E-Mail und Adresse.', type: 'Seite' },
    { title: 'Praxisteam', url: '/praxisteam', excerpt: 'Lernen Sie unser Team kennen.', type: 'Seite' },
  ];
  return new Response(JSON.stringify({ results }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
