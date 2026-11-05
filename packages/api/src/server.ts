import { serve } from '@hono/node-server';
import { createApp } from './composition-root';

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: createApp().fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
