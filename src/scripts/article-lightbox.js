// Lazy, scoped lightbox for article content images.
// - Only CONTENT figures zoom (not expert avatars / podcast covers).
// - Already-linked images (infographics) keep their <a>, just gain .glightbox.
// - glightbox JS + CSS are imported on the FIRST click only → off the critical
//   path (PSI win). Subsequent clicks are handled by glightbox itself.
const root = document.querySelector('.article-body');
if (root) {
  // keyboard access for horizontally-scrollable tables (a11y)
  root.querySelectorAll('.table-wrap').forEach((t) => {
    if (t.scrollWidth > t.clientWidth) {
      t.tabIndex = 0;
      t.setAttribute('role', 'region');
      t.setAttribute('aria-label', 'Tabelle (horizontal scrollbar)');
    }
  });
  const prep = () => {
    root.querySelectorAll('figure img').forEach((img) => {
      let a = img.closest('a');
      if (a) {
        a.classList.add('glightbox');
      } else {
        a = document.createElement('a');
        a.href = img.getAttribute('src') || '';
        a.className = 'glightbox';
        a.setAttribute('aria-label', 'Bild vergrößern');
        img.parentNode?.insertBefore(a, img);
        a.appendChild(img);
      }
      a.setAttribute('data-gallery', 'article');
    });
  };
  prep();

  let lb = null;
  root.addEventListener(
    'click',
    async (e) => {
      const a = e.target.closest && e.target.closest('a.glightbox');
      if (!a || lb) return; // once initialized, glightbox owns the clicks
      e.preventDefault();
      const [{ default: GLightbox }] = await Promise.all([
        import('glightbox'),
        import('glightbox/dist/css/glightbox.min.css'),
      ]);
      // plyr:{css:'',js:''} neutralises GLightbox's hardcoded cdn.plyr.io default
      // (galleries are image-only, so the video player is never needed) — keeps the
      // "0 live external calls" invariant safe even if a video slide is added later.
      lb = GLightbox({ selector: '.glightbox', loop: true, plyr: { css: '', js: '' } });
      const links = [...root.querySelectorAll('a.glightbox')];
      lb.openAt(Math.max(0, links.indexOf(a)));
    },
    true
  );
}
