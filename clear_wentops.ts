import { prisma } from './src/lib/prisma';

async function main() {
  await prisma.wentop.deleteMany();
  console.log("All wentops deleted.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
