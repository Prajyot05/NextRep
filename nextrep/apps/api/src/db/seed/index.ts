import 'dotenv/config';
import { seedExercises } from './exercises';

async function main() {
  await seedExercises();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
