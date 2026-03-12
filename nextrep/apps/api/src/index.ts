import 'dotenv/config';
import { buildApp } from './app';

const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`NextRep API running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
