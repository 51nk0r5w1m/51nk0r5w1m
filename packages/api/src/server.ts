/**
 * @module api/server
 * HTTP server entrypoint.
 */

import { buildApp } from './app';
import { buildContainer } from './container';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const container = buildContainer();
const app = buildApp(container);

app.listen(PORT, () => {
  console.log(`[CAF API] Server listening on http://localhost:${PORT}`);
  console.log(`[CAF API] Sprint 1 — mocked adapters active`);
});
