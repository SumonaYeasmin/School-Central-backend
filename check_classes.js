import prisma from "./dist/shared/prisma.js";

async function main() {
  const classes = await prisma.schoolClass.findMany({
    include: {
      sections: true,
      groups: true,
    },
    orderBy: { name: "asc" },
  });

  console.log("=== CLASSES & SECTIONS ===");
  for (const c of classes) {
    console.log(`Class: ${c.name} (ID: ${c.id})`);
    console.log(`  Sections: ${c.sections.map(s => `${s.name} (${s.id})`).join(", ")}`);
    if (c.groups.length > 0) {
      console.log(`  Groups: ${c.groups.map(g => `${g.name} (${g.id})`).join(", ")}`);
    }
  }

  const studentCount = await prisma.student.count();
  console.log(`Current Total Students in DB: ${studentCount}`);
}

main().catch(console.error).finally(() => process.exit(0));
