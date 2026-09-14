import { prisma } from './src/lib/prisma';

async function main() {
  await prisma.user.updateMany({
    where: { email: '36669465' },
    data: { name: 'Charly Castañeira' }
  });
  console.log("Admin name updated to Charly Castañeira.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
