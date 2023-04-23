import 'websocket-polyfill';

import fetch from 'node-fetch';

globalThis.fetch = fetch;
