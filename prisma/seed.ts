import prisma from '../src/shared/prisma.js';

// ===============================
// MAIN SEED FUNCTION
// ===============================

async function main() {
  console.log('🌱 Seeding academic data...');

  // ==========================================
  // 1. CREATE CLASSES & SECTIONS
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

    // Create Section A and Section B for each class
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

  console.log('✅ Classes and Sections (Section A & B) created');


  // ==========================================
  // 2. CREATE ACADEMIC GROUPS
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

  console.log('✅ Academic groups created');


  // ==========================================
  // 3. SUBJECT CREATION HELPER
  // ==========================================

  const subjectCache: Record<
    string,
    { id: string; name: string }
  > = {};

  async function getSubject(name: string) {
    if (subjectCache[name]) {
      return subjectCache[name];
    }

    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    subjectCache[name] = subject;

    return subject;
  }


  // ==========================================
  // 4. CLASS SUBJECT MAPPING HELPER
  // ==========================================

  async function addClassSubject(
    classId: string,
    subjectName: string,
    groupId: string | null = null,
    isCompulsory = true,
    isOptional = false,
  ) {
    const subject = await getSubject(subjectName);

    // groupId nullable হওয়ায় database unique constraint
    // দিয়ে duplicate পুরোপুরি আটকানো যাচ্ছে না।
    // তাই আগে manually check করছি।

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
  // 5. CLASS 6 SUBJECTS
  // ==========================================

  const class6Subjects = [
    'আনন্দপাঠ (বাংলা)',
    'চারুপাঠ (বাংলা)',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ধর্ম ও নৈতিক শিক্ষা (ইসলাম/হিন্দু/বৌদ্ধ/খ্রিস্ট)',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'চারু ও কারুকলা',
    'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];

  for (const subject of class6Subjects) {
    await addClassSubject(
      classes['Class 6'].id,
      subject,
    );
  }

  console.log('✅ Class 6 subjects added');


  // ==========================================
  // 6. CLASS 7 SUBJECTS
  // ==========================================

  const class7Subjects = [
    'আনন্দপাঠ (বাংলা)',
    'চারুপাঠ (বাংলা)',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ধর্ম ও নৈতিক শিক্ষা (ইসলাম/হিন্দু/বৌদ্ধ/খ্রিস্ট)',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'চারু ও কারুকলা',
    'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];

  for (const subject of class7Subjects) {
    await addClassSubject(
      classes['Class 7'].id,
      subject,
    );
  }

  console.log('✅ Class 7 subjects added');


  // ==========================================
  // 7. CLASS 8 SUBJECTS
  // ==========================================

  const class8Subjects = [
    'আনন্দপাঠ (বাংলা)',
    'সাহিত্য কণিকা (বাংলা)',
    'বাংলা ব্যাকরণ ও নির্মিতি',
    'English For Today',
    'English Grammar and Composition',
    'গণিত',
    'বিজ্ঞান',
    'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ধর্ম ও নৈতিক শিক্ষা',
    'শারীরিক শিক্ষা ও স্বাস্থ্য',
    'কর্ম ও জীবনমুখী শিক্ষা',
    'চারু ও কারুকলা',
    'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];

  for (const subject of class8Subjects) {
    await addClassSubject(
      classes['Class 8'].id,
      subject,
    );
  }

  console.log('✅ Class 8 subjects added');


  // ==========================================
  // 8. CLASS 9–10 COMMON SUBJECTS
  // ==========================================

  const class9_10CommonSubjects = [
    'বাংলা (বাংলা সাহিত্য, বাংলা সহপাঠ, বাংলা ব্যাকরণ ও নির্মিতি)',
    'English (English For Today, English Grammar & Composition)',
    'সাধারণ গণিত',
    'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    'ধর্ম ও নৈতিক শিক্ষা',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'সাধারণ বিজ্ঞান',
    'ক্যারিয়ার শিক্ষা',
    'শারীরিক শিক্ষা, স্বাস্থ্যবিজ্ঞান ও খেলাধুলা',
  ];


  // ==========================================
  // 9. ADD COMMON SUBJECTS TO CLASS 9
  // ==========================================

  for (const subject of class9_10CommonSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      subject,
    );
  }

  console.log('✅ Class 9 common subjects added');


  // ==========================================
  // 10. ADD COMMON SUBJECTS TO CLASS 10
  // ==========================================

  for (const subject of class9_10CommonSubjects) {
    await addClassSubject(
      classes['Class 10'].id,
      subject,
    );
  }

  console.log('✅ Class 10 common subjects added');


  // ==========================================
  // 11. SCIENCE SUBJECTS
  // ==========================================

  const scienceSubjects = [
    'পদার্থবিজ্ঞান',
    'রসায়ন',
    'জীববিজ্ঞান',
    'উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];


  // Class 9 Science
  for (const subject of scienceSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      subject,
      groups['Science'].id,
      subject === 'উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }


  // Class 10 Science
  for (const subject of scienceSubjects) {
    await addClassSubject(
      classes['Class 10'].id,
      subject,
      groups['Science'].id,
      subject === 'উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }

  console.log('✅ Science subjects added');


  // ==========================================
  // 12. HUMANITIES SUBJECTS
  // ==========================================

  const humanitiesSubjects = [
    'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা',
    'ভূগোল ও পরিবেশ',
    'পৌরনীতি ও নাগরিকতা / অর্থনীতি',
    'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];


  // Class 9 Humanities
  for (const subject of humanitiesSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      subject,
      groups['Humanities'].id,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }


  // Class 10 Humanities
  for (const subject of humanitiesSubjects) {
    await addClassSubject(
      classes['Class 10'].id,
      subject,
      groups['Humanities'].id,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }

  console.log('✅ Humanities subjects added');


  // ==========================================
  // 13. BUSINESS STUDIES SUBJECTS
  // ==========================================

  const businessStudiesSubjects = [
    'হিসাববিজ্ঞান',
    'ব্যবসায় উদ্যোগ',
    'ফিন্যান্স ও ব্যাংকিং',
    'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
  ];


  // Class 9 Business Studies
  for (const subject of businessStudiesSubjects) {
    await addClassSubject(
      classes['Class 9'].id,
      subject,
      groups['Business Studies'].id,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }


  // Class 10 Business Studies
  for (const subject of businessStudiesSubjects) {
    await addClassSubject(
      classes['Class 10'].id,
      subject,
      groups['Business Studies'].id,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান'
        ? false
        : true,
      subject === 'কৃষি শিক্ষা / গার্হস্থ্য বিজ্ঞান',
    );
  }

  console.log('✅ Business Studies subjects added');


  // ==========================================
  // DONE
  // ==========================================

  console.log('');
  console.log('🎉 Academic seed completed successfully!');
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
