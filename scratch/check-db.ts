import prisma from '../src/shared/prisma.js';

async function main() {
  const classes = await prisma.schoolClass.findMany({
    include: { sections: true },
  });
  console.log('Classes and Sections in DB:', JSON.stringify(classes, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
