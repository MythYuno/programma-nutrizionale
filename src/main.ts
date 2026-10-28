import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import './app.css';
import App from './App.svelte';

registerSW({ immediate: true });

// La v1 aveva un service worker scritto a mano con cache "piano11-*":
// le sue cache non servono più.
if ('caches' in window) {
  caches.keys().then((keys) => keys.filter((k) => k.startsWith('piano11-')).forEach((k) => caches.delete(k)));
}

export default mount(App, { target: document.getElementById('app')! });
