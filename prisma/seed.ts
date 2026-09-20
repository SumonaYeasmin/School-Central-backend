import prisma from '../src/shared/prisma.js';

// ===============================
// MAIN SEED FUNCTION
// ===============================

async function main() {
  console.log('🌱 Seeding accurate academic data (Classes, Groups, Subjects)...');

  // ==========================================
  // 1. ENSURE CLASSES & SECTIONS (Never delete existing classes)
  // ==========================================

  const classNames = [
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const sectionNames = ['Section A', 'Section B'];

  const classes: Record<string, { id: string; name: string }> = {};

  for (const name of classNames) {
    const schoolClass = await prisma.schoolClass.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    classes[name] = schoolClass;

    for (const secName of sectionNames) {
      await prisma.section.upsert({
        where: {
          classId_name: {
            classId: schoolClass.id,
            name: secName,
          },
        },
        update: {},
        create: {
          name: secName,
          classId: schoolClass.id,
        },
      });
    }
  }

  console.log('✅ Classes and Sections ensured');

  // ==========================================
  // 2. ENSURE ACADEMIC GROUPS
  // ==========================================

  const groupNames = [
    'Science',
    'Humanities',
    'Business Studies',
  ];

  const groups: Record<string, { id: string; name: string }> = {};

  for (const name of groupNames) {
    const group = await prisma.academicGroup.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    groups[name] = group;
  }

  console.log('✅ Academic groups ensured');

  // ==========================================
  // 3. CLEAN ONLY PREVIOUS CLASS-SUBJECT MAPPINGS
  // (Students, Parents, Teachers, Classes are untouched!)
  // ==========================================
  await prisma.classSubject.deleteMany({});
  console.log('🧹 Cleaned previous duplicate class-subject mappings');

  // ==========================================
  // 4. SUBJECT CREATION & UPSERT HELPER
  // ==========================================

  const subjectCache: Record<string, { id: string; name: string }> = {};

  async function getOrCreateSubject(name: string, code: string | null = null) {
    if (subjectCache[name]) {
      if (code) {
        await prisma.subject.update({
          where: { name },
          data: { code },
        });
      }
      return subjectCache[name];
    }

    const subject = await prisma.subject.upsert({
      where: { name },
      update: {
        code: code || undefined,
      },
      create: {
        name,
        code,
      },
    });

    subjectCache[name] = subject;
    return subject;
  }

  // ==========================================
  // 5. CLASS SUBJECT MAPPING HELPER
  // ==========================================

  async function addClassSubject(
    classId: string,
    subjectName: string,
    code: string | null = null,
    groupId: string | null = null,
    isCompulsory = true,
    isOptional = false,
  ) {
    const subject = await getOrCreateSubject(subjectName, code);

    const existing = await prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId: subject.id,
        groupId,
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.classSubject.create({
      data: {
        classId,
        subjectId: subject.id,
        groupId,
        isCompulsory,
        isOptional,
      },
    });
  }

  // ==========================================
  // 6. CLASS 6 SUBJECTS (12 Core + 7 Optional)
  // ==========================================

  const class6Core = [
    'চারুপাঠ',
    'আনন্দপাঠ',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'তথ্য ও যোগাযোগ প্রযুক্তি',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'ধর্ম ও নৈতিক শিক্ষা',
  ];

  const class6Optional = [
    'কৃষিশিক্ষা',
    'গার্হস্থ্যবিজ্ঞান',
    'চারু ও কারুকলা',
    'আরবি',
    'সংস্কৃত',
    'পালি',
    'সংগীত',
  ];

  for (const subject of class6Core) {
    await addClassSubject(classes['Class 6'].id, subject, null, null, true, false);
  }
  for (const subject of class6Optional) {
    await addClassSubject(classes['Class 6'].id, subject, null, null, false, true);
  }

  console.log('✅ Class 6 subjects mapped (12 Core, 7 Optional)');

  // ==========================================
  // 7. CLASS 7 SUBJECTS (12 Core + 7 Optional)
  // ==========================================

  const class7Core = [
    'সপ্তবর্ণা',
    'আনন্দপাঠ',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'তথ্য ও যোগাযোগ প্রযুক্তি',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'ধর্ম ও নৈতিক শিক্ষা',
  ];

  const class7Optional = [
    'কৃষিশিক্ষা',
    'গার্হস্থ্যবিজ্ঞান',
    'চারু ও কারুকলা',
    'আরবি',
    'সংস্কৃত',
    'পালি',
    'সংগীত',
  ];

  for (const subject of class7Core) {
    await addClassSubject(classes['Class 7'].id, subject, null, null, true, false);
  }
  for (const subject of class7Optional) {
    await addClassSubject(classes['Class 7'].id, subject, null, null, false, true);
  }

  console.log('✅ Class 7 subjects mapped (12 Core, 7 Optional)');

  // ==========================================
  // 8. CLASS 8 SUBJECTS (12 Core + 7 Optional)
  // ==========================================

  const class8Core = [
    'সাহিত্য-কণিকা',
    'আনন্দপাঠ',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'তথ্য ও যোগাযোগ প্রযুক্তি',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'ধর্ম ও নৈতিক শিক্ষা',
  ];

  const class8Optional = [
    'কৃষিশিক্ষা',
    'গার্হস্থ্যবিজ্ঞান',
    'চারু ও কারুকলা',
    'আরবি',
    'সংস্কৃত',
    'পালি',
    'সংগীত',
  ];

  for (const subject of class8Core) {
    await addClassSubject(classes['Class 8'].id, subject, null, null, true, false);
  }
  for (const subject of class8Optional) {
    await addClassSubject(classes['Class 8'].id, subject, null, null, false, true);
  }

  console.log('✅ Class 8 subjects mapped (12 Core, 7 Optional)');

  // ==========================================
  // 9. CLASS 9–10 COMMON SUBJECTS (WITH SSC CODES)
  // ==========================================

  const class9_10CommonSubjects = [
    { name: 'বাংলা সাহিত্য', code: '101' },
    { name: 'বাংলা সহপাঠ', code: '102' },
    { name: 'বাংলা ভাষার ব্যাকরণ ও নির্মিতি', code: '103' },
    { name: 'English For Today', code: '107' },
    { name: 'English Grammar and Composition', code: '108' },
    { name: 'গণিত', code: '109' },
    { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', code: '154' },
    { name: 'বাংলাদেশ ও বিশ্বপরিচয়', code: '150' },
    { name: 'শারীরিক শিক্ষা, স্বাস্থ্যবিজ্ঞান ও খেলাধুলা', code: '147' },
    { name: 'ক্যারিয়ার শিক্ষা', code: '156' },
    { name: 'ধর্ম ও নৈতিক শিক্ষা', code: '111' },
  ];

  for (const sub of class9_10CommonSubjects) {
    await addClassSubject(classes['Class 9'].id, sub.name, sub.code, null, true, false);
    await addClassSubject(classes['Class 10'].id, sub.name, sub.code, null, true, false);
  }

  console.log('✅ Class 9 & 10 common subjects mapped with SSC codes');

  // ==========================================
  // 10. SCIENCE GROUP (CLASS 9 & 10)
  // ==========================================

  const scienceSubjects = [
    { name: 'পদার্থবিজ্ঞান', code: '136', isCompulsory: true, isOptional: false },
    { name: 'রসায়ন', code: '137', isCompulsory: true, isOptional: false },
    { name: 'জীববিজ্ঞান', code: '138', isCompulsory: true, isOptional: false },
    { name: 'উচ্চতর গণিত', code: '126', isCompulsory: false, isOptional: true },
  ];

  for (const sub of scienceSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      sub.name,
      sub.code,
      groups['Science'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
    await addClassSubject(
      classes['Class 10'].id,
      sub.name,
      sub.code,
      groups['Science'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
  }

  console.log('✅ Science group subjects mapped');

  // ==========================================
  // 11. HUMANITIES GROUP (CLASS 9 & 10)
  // ==========================================

  const humanitiesSubjects = [
    { name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', code: '153', isCompulsory: true, isOptional: false },
    { name: 'ভূগোল ও পরিবেশ', code: '110', isCompulsory: true, isOptional: false },
    { name: 'পৌরনীতি ও নাগরিকতা', code: '140', isCompulsory: true, isOptional: false },
    { name: 'অর্থনীতি', code: '141', isCompulsory: false, isOptional: true },
  ];

  for (const sub of humanitiesSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      sub.name,
      sub.code,
      groups['Humanities'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
    await addClassSubject(
      classes['Class 10'].id,
      sub.name,
      sub.code,
      groups['Humanities'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
  }

  console.log('✅ Humanities group subjects mapped');

  // ==========================================
  // 12. BUSINESS STUDIES GROUP (CLASS 9 & 10)
  // ==========================================

  const businessSubjects = [
    { name: 'হিসাববিজ্ঞান', code: '146', isCompulsory: true, isOptional: false },
    { name: 'ফিন্যান্স ও ব্যাংকিং', code: '152', isCompulsory: true, isOptional: false },
    { name: 'ব্যবসায় উদ্যোগ', code: '143', isCompulsory: true, isOptional: false },
  ];

  for (const sub of businessSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      sub.name,
      sub.code,
      groups['Business Studies'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
    await addClassSubject(
      classes['Class 10'].id,
      sub.name,
      sub.code,
      groups['Business Studies'].id,
      sub.isCompulsory,
      sub.isOptional,
    );
  }

  console.log('✅ Business Studies group subjects mapped');

  // ==========================================
  // 13. OPTIONAL & ELECTIVE (CLASS 9 & 10)
  // ==========================================

  const optionalOthers = [
    { name: 'কৃষিশিক্ষা', code: '134' },
    { name: 'গার্হস্থ্যবিজ্ঞান', code: '151' },
    { name: 'চারু ও কারুকলা', code: '148' },
    { name: 'সংগীত', code: '149' },
    { name: 'আরবি', code: '121' },
    { name: 'সংস্কৃত', code: '123' },
    { name: 'পালি', code: '124' },
  ];

  for (const sub of optionalOthers) {
    await addClassSubject(classes['Class 9'].id, sub.name, sub.code, null, false, true);
    await addClassSubject(classes['Class 10'].id, sub.name, sub.code, null, false, true);
  }

  console.log('✅ Optional & Elective subjects mapped with codes');

  console.log('');
  console.log('🎉 Academic curriculum seed completed successfully! All students & parents remain 100% untouched.');
}

// ==========================================
// RUN SEED
// ==========================================

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
