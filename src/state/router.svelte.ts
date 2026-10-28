// Router a hash: #/oggi, #/settimana, #/giorno/2026-10-27, #/peso, #/piano…
export type Tab = 'oggi' | 'settimana' | 'peso' | 'piano';

function parse(hash: string): string[] {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return parts.length ? parts : ['oggi'];
}

class Router {
  parts = $state(parse(location.hash));

  tab = $derived<Tab>(((): Tab => {
    const p = this.parts[0];
    if (p === 'giorno') return 'settimana';
    return p === 'settimana' || p === 'peso' || p === 'piano' ? p : 'oggi';
  })());

  constructor() {
    window.addEventListener('hashchange', () => {
      this.parts = parse(location.hash);
      window.scrollTo(0, 0);
    });
  }

  go(path: string) {
    location.hash = '#/' + path;
  }

  back(fallback: string) {
    if (history.length > 1) history.back();
    else this.go(fallback);
  }
}

export const router = new Router();
