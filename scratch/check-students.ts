import prisma from '../src/shared/prisma.js';

async function main() {
  const students = await prisma.student.findMany();
  console.log('Total students in DB:', students.length);
  console.log('Students:', JSON.stringify(students, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
