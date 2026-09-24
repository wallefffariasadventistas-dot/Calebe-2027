// Service worker mínimo: permite instalar o Calebe 2027 como aplicativo.
// Não guarda cópias das páginas, então cada abertura carrega a versão mais recente.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
