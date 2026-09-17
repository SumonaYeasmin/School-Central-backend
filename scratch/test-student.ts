import prisma from '../src/shared/prisma.js';

async function main() {
  const student = await prisma.student.create({
    data: {
      studentId: 'STU-2026-001',
      name: 'Rahim Ahmed',
      classId: 'cmu40eurg0000eospz5h1i6ax',
      sectionId: 'cmu4ystbq0000mcsp9dxqzmxc',
      roll: '01',
      gender: 'MALE',
      status: 'ACTIVE',
    },
    include: {
      class: true,
      section: true,
    },
  });

  console.log('Created student successfully:', JSON.stringify(student, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
