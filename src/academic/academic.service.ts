import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';

// NCTB Curriculum Sorting Helper
const SUBJECT_ORDER_WEIGHTS: Record<string, number> = {
  // 1. Bangla
  'চারুপাঠ': 10,
  'সপ্তবর্ণা': 11,
  'সাহিত্য-কণিকা': 12,
  'আনন্দপাঠ': 13,
  'বাংলা সাহিত্য': 14,
  'বাংলা সহপাঠ': 15,
  'বাংলা ব্যাকরণ ও নির্মিতি': 16,
  'বাংলা ভাষার ব্যাকরণ ও নির্মিতি': 17,
  // 2. English
  'English For Today': 20,
  'English Grammar and Composition': 21,
  // 3. Mathematics
  'গণিত': 30,
  'সাধারণ গণিত': 31,
  // 4. Science
  'বিজ্ঞান': 40,
  'সাধারণ বিজ্ঞান': 41,
  // 5. BGS & ICT
  'বাংলাদেশ ও বিশ্বপরিচয়': 50,
  'তথ্য ও যোগাযোগ প্রযুক্তি': 60,
  // 6. Religion
  'ধর্ম ও নৈতিক শিক্ষা': 70,
  // 7. Physical & Life Skills
  'শারীরিক শিক্ষা ও স্বাস্থ্য': 80,
  'শারীরিক শিক্ষা, healthবিজ্ঞান ও খেলাধুলা': 81,
  'কর্ম ও জীবনমুখী শিক্ষা': 90,
  'ক্যারিয়ার শিক্ষা': 91,
  // 8. Agriculture, Home Eco, Arts
  'কৃষিশিক্ষা': 100,
  'গার্হস্থ্যবিজ্ঞান': 101,
  'চারু ও কারুকলা': 102,
  // 9. Science Group
  'পদার্থবিজ্ঞান': 120,
  'রসায়ন': 121,
  'জীববিজ্ঞান': 122,
  'উচ্চতর গণিত': 123,
  // 10. Humanities Group
  'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা': 140,
  'ভূগোল ও পরিবেশ': 141,
  'পৌরনীতি ও নাগরিকতা': 142,
  'অর্থনীতি': 143,
  // 11. Business Studies Group
  'হিসাববিজ্ঞান': 160,
  'ফিন্যান্স ও ব্যাংকিং': 161,
  'ব্যবসায় উদ্যোগ': 162,
  // 12. Optional languages & others
  'আরবি': 180,
  'সংস্কৃত': 181,
  'পালি': 182,
  'সংগীত': 183,
};

function getSubjectSortWeight(name?: string, code?: string | null): number {
  if (!name) return 999;
  if (SUBJECT_ORDER_WEIGHTS[name] !== undefined) {
    return SUBJECT_ORDER_WEIGHTS[name];
  }
  for (const [key, weight] of Object.entries(SUBJECT_ORDER_WEIGHTS)) {
    if (name.includes(key)) return weight;
  }
  if (code && !isNaN(Number(code))) {
    return 200 + Number(code);
  }
  return 999;
}

@Injectable()
export class AcademicService {
  async createClass(createClassDto: CreateClassDto) {
    const { name } = createClassDto;

    const schoolClass = await prisma.schoolClass.create({
      data: {
        name,
      },
    });

    return schoolClass;
  }

  // ক্লাস আপডেট করা
  async updateClass(id: string, updateClassDto: { name?: string; sections?: string[] }) {
    const { name, sections } = updateClassDto;

    if (name) {
      await prisma.schoolClass.update({
        where: { id },
        data: { name },
      });
    }

    if (sections && Array.isArray(sections)) {
      for (const secName of sections) {
        if (secName.trim()) {
          const existing = await prisma.section.findFirst({
            where: { classId: id, name: secName.trim() },
          });
          if (!existing) {
            await prisma.section.create({
              data: { classId: id, name: secName.trim() },
            });
          }
        }
      }
    }

    return this.getAllClasses();
  }

  // ক্লাস ডিলিট করা
  async deleteClass(id: string) {
    await prisma.schoolClass.delete({
      where: { id },
    });
    return { success: true, message: 'Class deleted successfully' };
  }

  // সাবজেক্ট তৈরি এবং ক্লাসের সাথে যুক্ত করা
  async createSubject(createSubjectDto: CreateSubjectDto) {
    const { name, code, classId, classIds } = createSubjectDto;

    // সাবজেক্ট তৈরি বা খুঁজে বের করা
    const subject = await prisma.subject.upsert({
      where: { name },
      update: { code: code || undefined },
      create: { name, code },
    });

    const targetClassIds =
      classIds && classIds.length > 0
        ? classIds
        : classId
        ? [classId]
        : [];

    for (const cId of targetClassIds) {
      const existingClassSubject = await prisma.classSubject.findFirst({
        where: { classId: cId, subjectId: subject.id },
      });

      if (!existingClassSubject) {
        await prisma.classSubject.create({
          data: {
            classId: cId,
            subjectId: subject.id,
          },
        });
      }
    }

    return subject;
  }

  // সাবজেক্ট আপডেট করা
  async updateSubject(id: string, updateSubjectDto: UpdateSubjectDto) {
    const { name, code, classIds, groupId, isCompulsory, isOptional } = updateSubjectDto;

    await prisma.subject.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
      },
    });

    // If classIds are provided, synchronize the classSubject associations
    if (classIds && Array.isArray(classIds) && classIds.length > 0) {
      // Remove existing class associations not in new list
      await prisma.classSubject.deleteMany({
        where: {
          subjectId: id,
          classId: { notIn: classIds },
        },
      });

      // Upsert new class associations
      for (const classId of classIds) {
        const existing = await prisma.classSubject.findFirst({
          where: { subjectId: id, classId },
        });

        if (existing) {
          await prisma.classSubject.update({
            where: { id: existing.id },
            data: {
              ...(groupId !== undefined ? { groupId } : {}),
              ...(isCompulsory !== undefined ? { isCompulsory } : {}),
              ...(isOptional !== undefined ? { isOptional } : {}),
            },
          });
        } else {
          await prisma.classSubject.create({
            data: {
              subjectId: id,
              classId,
              groupId: groupId || null,
              isCompulsory: isCompulsory ?? true,
              isOptional: isOptional ?? false,
            },
          });
        }
      }
    }

    return this.getAllSubjects();
  }

  // সাবজেক্ট ডিলিট করা
  async deleteSubject(id: string) {
    await prisma.subject.delete({
      where: { id },
    });
    return { success: true, message: 'Subject deleted successfully' };
  }

  // কোনো ক্লাসের সব সাবজেক্ট দেখা
  async getSubjectsByClass(classId: string) {
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        group: true,
      },
    });

    const mapped = classSubjects.map((cs) => ({
      ...cs.subject,
      isCompulsory: cs.isCompulsory,
      isOptional: cs.isOptional,
      group: cs.group,
    }));

    return mapped.sort((a, b) => {
      const wA = getSubjectSortWeight(a.name, a.code);
      const wB = getSubjectSortWeight(b.name, b.code);
      if (wA !== wB) return wA - wB;
      return a.name.localeCompare(b.name, 'bn');
    });
  }

  // নতুন সেকশন তৈরি করা
  async createSection(createSectionDto: CreateSectionDto) {
    return await prisma.section.create({
      data: createSectionDto,
    });
  }

  // সব ক্লাস, সেকশন ও বিষয় ডাটাবেজ থেকে আনা (Natural numeric order: Class 6 -> Class 10)
  async getAllClasses() {
    const classes = await prisma.schoolClass.findMany({
      include: {
        sections: {
          orderBy: {
            name: 'asc',
          },
        },
        classSubjects: {
          include: {
            subject: true,
            group: true,
          },
        },
      },
    });

    classes.forEach((cls) => {
      if (cls.classSubjects) {
        cls.classSubjects.sort((a, b) => {
          const wA = getSubjectSortWeight(a.subject?.name, a.subject?.code);
          const wB = getSubjectSortWeight(b.subject?.name, b.subject?.code);
          if (wA !== wB) return wA - wB;
          return (a.subject?.name || '').localeCompare(b.subject?.name || '', 'bn');
        });
      }
    });

    return classes.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }

  // সব বিষয় ডাটাবেজ থেকে আনা (classes, groups এবং teachers সহ)
  async getAllSubjects() {
    const subjects = await prisma.subject.findMany({
      include: {
        classSubjects: {
          include: {
            class: true,
            group: true,
          },
        },
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
      },
    });

    return subjects.sort((a, b) => {
      const wA = getSubjectSortWeight(a.name, a.code);
      const wB = getSubjectSortWeight(b.name, b.code);
      if (wA !== wB) return wA - wB;
      return a.name.localeCompare(b.name, 'bn');
    });
  }
}
