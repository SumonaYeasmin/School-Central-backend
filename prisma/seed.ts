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

  // ==========================================
  // 14. ENSURE USER ACCOUNTS (Admin & Teacher)
  // ==========================================
  console.log('\n👤 Ensuring Admin & Teacher User accounts...');
  const defaultPasswordHash = '$2b$10$w60N1aE2b9tF8rFvI0g7c.e5t3s/L2P5G9jK7M1N3Q5S7U9W1Y3a2'; // Hashed password or generated

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: defaultPasswordHash,
      role: 'ADMIN',
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: { role: 'TEACHER' },
    create: {
      name: 'Anisur Rahman',
      email: 'teacher@gmail.com',
      password: defaultPasswordHash,
      role: 'TEACHER',
    },
  });

  console.log('✅ Admin (admin@gmail.com) and Teacher (teacher@gmail.com) users ensured');

  // ==========================================
  // 15. ENSURE REALISTIC TEACHERS & THEIR USER ACCOUNTS
  // ==========================================
  console.log('\n👨‍🏫 Ensuring 12 Realistic Teachers & User Logins...');

  const teachersSeedData = [
    {
      teacherId: 'TCH-2026-001',
      name: 'Anisur Rahman',
      email: 'teacher@gmail.com',
      phone: '01711223344',
      designation: 'Headmaster & Senior Mathematics Teacher',
      department: 'Mathematics',
    },
    {
      teacherId: 'TCH-2026-002',
      name: 'Farhana Sultana',
      email: 'farhana.sultana@school.com',
      phone: '01812345678',
      designation: 'Senior Bangla Teacher',
      department: 'Bangla',
    },
    {
      teacherId: 'TCH-2026-003',
      name: 'Rafael Ortiz',
      email: 'rafael.ortiz@school.com',
      phone: '01912345679',
      designation: 'Senior Science & Physics Faculty',
      department: 'Science',
    },
    {
      teacherId: 'TCH-2026-004',
      name: 'Priya Nair',
      email: 'priya.nair@school.com',
      phone: '01798765432',
      designation: 'Senior English Teacher',
      department: 'English',
    },
    {
      teacherId: 'TCH-2026-005',
      name: 'Robert Kiyosaki',
      email: 'robert.k@school.com',
      phone: '01655443322',
      designation: 'Senior Commerce Teacher',
      department: 'Commerce',
    },
    {
      teacherId: 'TCH-2026-006',
      name: 'Marie Curie',
      email: 'marie.curie@school.com',
      phone: '01733445566',
      designation: 'Senior Chemistry Teacher',
      department: 'Science',
    },
    {
      teacherId: 'TCH-2026-007',
      name: 'Dr. Charles Darwin',
      email: 'charles.darwin@school.com',
      phone: '01877665544',
      designation: 'Senior Biology Teacher',
      department: 'Science',
    },
    {
      teacherId: 'TCH-2026-008',
      name: 'Kabir Ahmed',
      email: 'kabir.ahmed@school.com',
      phone: '01511223344',
      designation: 'Senior History & Social Science Teacher',
      department: 'Humanities',
    },
    {
      teacherId: 'TCH-2026-009',
      name: 'Nasreen Akter',
      email: 'nasreen.akter@school.com',
      phone: '01999887766',
      designation: 'ICT Lecturer',
      department: 'ICT',
    },
    {
      teacherId: 'TCH-2026-010',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@school.com',
      phone: '01744556677',
      designation: 'Assistant Teacher (General Science & Geography)',
      department: 'Humanities',
    },
    {
      teacherId: 'TCH-2026-011',
      name: 'Mahbubur Rahman',
      email: 'mahbub.rahman@school.com',
      phone: '01855667788',
      designation: 'Senior Religious & Moral Education Teacher',
      department: 'Humanities',
    },
    {
      teacherId: 'TCH-2026-012',
      name: 'Subrata Roy',
      email: 'subrata.roy@school.com',
      phone: '01611223355',
      designation: 'Physical Education & Health Instructor',
      department: 'Physical Education',
    },
  ];

  const teacherRecords: Record<string, any> = {};

  for (const t of teachersSeedData) {
    // 1. Ensure Teacher record
    const teacher = await prisma.teacher.upsert({
      where: { teacherId: t.teacherId },
      update: {
        name: t.name,
        email: t.email,
        phone: t.phone,
        designation: t.designation,
        department: t.department,
      },
      create: {
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        designation: t.designation,
        department: t.department,
      },
    });

    // 2. Ensure User Login Account for this Teacher
    if (t.email) {
      await prisma.user.upsert({
        where: { email: t.email },
        update: {
          name: t.name,
          role: 'TEACHER',
        },
        create: {
          name: t.name,
          email: t.email,
          password: defaultPasswordHash,
          role: 'TEACHER',
        },
      });
    }

    teacherRecords[t.name] = teacher;
  }

  const allTeachersList = Object.values(teacherRecords);
  console.log(`✅ ${allTeachersList.length} Teachers & User Login accounts ensured in database`);

  // Helper to pick appropriate subject teacher
  const findTeacherForSubject = (subjectName: string, fallbackIdx = 0) => {
    const s = subjectName.toLowerCase();
    if (s.includes('বাংলা') || s.includes('bangla')) return teacherRecords['Farhana Sultana'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('english')) return teacherRecords['Priya Nair'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('গণিত') || s.includes('math')) return teacherRecords['Anisur Rahman'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('পদার্থ') || s.includes('phys')) return teacherRecords['Rafael Ortiz'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('রসায়ন') || s.includes('রসায়ন') || s.includes('chem')) return teacherRecords['Marie Curie'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('জীব') || s.includes('bio')) return teacherRecords['Dr. Charles Darwin'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('হিসাব') || s.includes('ফিন্যান্স') || s.includes('ব্যবসায়') || s.includes('ব্যবসায়')) return teacherRecords['Robert Kiyosaki'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('ইতিহাস') || s.includes('বিশ্বপরিচয়') || s.includes('বিশ্বপরিচয়')) return teacherRecords['Kabir Ahmed'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('তথ্য') || s.includes('ict')) return teacherRecords['Nasreen Akter'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('ধর্ম') || s.includes('moral')) return teacherRecords['Mahbubur Rahman'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('শারীরিক') || s.includes('স্বাস্থ্য')) return teacherRecords['Subrata Roy'] || allTeachersList[fallbackIdx % allTeachersList.length];
    if (s.includes('বিজ্ঞান') || s.includes('ভূগোল')) return teacherRecords['Sarah Jenkins'] || allTeachersList[fallbackIdx % allTeachersList.length];
    return allTeachersList[fallbackIdx % allTeachersList.length];
  };

  // ==========================================
  // 16. ENSURE TEACHER ASSIGNMENTS (Subject & Class Teachers)
  // ==========================================
  console.log('\n📝 Assigning Teachers to Classes, Sections & Subjects...');

  for (const [className, classObj] of Object.entries(classes)) {
    const classSections = await prisma.section.findMany({
      where: { classId: classObj.id },
    });

    const classSubjectsList = await prisma.classSubject.findMany({
      where: { classId: classObj.id },
      include: { subject: true },
    });

    for (let secIdx = 0; secIdx < classSections.length; secIdx++) {
      const section = classSections[secIdx];
      const isSecA = section.name.toLowerCase().includes('a');

      // Section A Class Teacher: Anisur Rahman; Section B Class Teacher: Priya Nair
      const classTeacher = isSecA
        ? (teacherRecords['Anisur Rahman'] || allTeachersList[0])
        : (teacherRecords['Priya Nair'] || allTeachersList[1 % allTeachersList.length]);

      // Assign major subjects
      for (let sIdx = 0; sIdx < Math.min(classSubjectsList.length, 12); sIdx++) {
        const cs = classSubjectsList[sIdx];
        const assignedTeacher = sIdx === 0 ? classTeacher : findTeacherForSubject(cs.subject.name, sIdx);
        const isCT = (sIdx === 0 && assignedTeacher.id === classTeacher.id);

        await prisma.teacherAssignment.upsert({
          where: {
            classId_sectionId_subjectId: {
              classId: classObj.id,
              sectionId: section.id,
              subjectId: cs.subjectId,
            },
          },
          update: {
            teacherId: assignedTeacher.id,
            isClassTeacher: isCT,
          },
          create: {
            classId: classObj.id,
            sectionId: section.id,
            subjectId: cs.subjectId,
            teacherId: assignedTeacher.id,
            isClassTeacher: isCT,
          },
        });
      }
    }
  }

  console.log('✅ Teacher assignments successfully created for all classes & sections');

  // ==========================================
  // 17. ENSURE CLASS ROUTINES (Weekly timetable for all classes)
  // ==========================================
  console.log('\n🗓️ Seeding Weekly Class Routines (Sunday to Thursday)...');

  // Clean old routines to ensure crisp fresh schedule
  await prisma.classRoutine.deleteMany({});

  const routineDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;
  const routineSlots = [
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
  ];

  let totalRoutinesCount = 0;

  const classEntries = Object.entries(classes);
  for (let cIdx = 0; cIdx < classEntries.length; cIdx++) {
    const [className, classObj] = classEntries[cIdx];
    const classSections = await prisma.section.findMany({
      where: { classId: classObj.id },
    });

    const classSubjectsList = await prisma.classSubject.findMany({
      where: { classId: classObj.id },
      include: { subject: true },
    });

    if (classSubjectsList.length === 0) continue;

    for (let secIdx = 0; secIdx < classSections.length; secIdx++) {
      const section = classSections[secIdx];
      const baseRoom = `Room ${101 + cIdx * 10 + secIdx}`;

      for (let dIdx = 0; dIdx < routineDays.length; dIdx++) {
        const day = routineDays[dIdx];

        for (let pIdx = 0; pIdx < routineSlots.length; pIdx++) {
          const slot = routineSlots[pIdx];
          const subIdx = (dIdx * 2 + pIdx + secIdx) % classSubjectsList.length;
          const cs = classSubjectsList[subIdx];
          const subject = cs.subject;
          const teacher = findTeacherForSubject(subject.name, subIdx + dIdx + cIdx);

          let roomNumber = baseRoom;
          const sLower = subject.name.toLowerCase();
          if (sLower.includes('পদার্থ') || sLower.includes('phys')) roomNumber = 'Physics Lab';
          else if (sLower.includes('রসায়ন') || sLower.includes('রসায়ন') || sLower.includes('chem')) roomNumber = 'Chemistry Lab';
          else if (sLower.includes('জীব') || sLower.includes('bio')) roomNumber = 'Biology Lab';
          else if (sLower.includes('তথ্য') || sLower.includes('ict')) roomNumber = 'ICT Lab';

          await prisma.classRoutine.create({
            data: {
              day: day as any,
              startTime: slot.start,
              endTime: slot.end,
              roomNumber,
              classId: classObj.id,
              sectionId: section.id,
              subjectId: subject.id,
              teacherId: teacher.id,
            },
          });

          totalRoutinesCount++;
        }
      }
    }
  }

  console.log(`✅ Created ${totalRoutinesCount} Class Routine periods across Class 6 to 10 (Section A & B)`);

  console.log('');
  console.log('🎉 Academic curriculum, Teachers, Assignments, and Routines seed completed successfully!');
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
