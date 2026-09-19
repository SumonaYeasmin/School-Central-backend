
import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { CreateSectionDto } from './dto/create-section.dto.js';

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

  // সাবজেক্ট তৈরি এবং ক্লাসের সাথে যুক্ত করা
  async createSubject(createSubjectDto: CreateSubjectDto) {
    const { name, code, classId } = createSubjectDto;

    // সাবজেক্ট তৈরি বা খুঁজে বের করা
    const subject = await prisma.subject.upsert({
      where: { name },
      update: { code: code || undefined },
      create: { name, code },
    });

    // ক্লাসের সাথে সাবজেক্ট যুক্ত করা (ClassSubject)
    const existingClassSubject = await prisma.classSubject.findFirst({
      where: { classId, subjectId: subject.id },
    });

    if (!existingClassSubject) {
      await prisma.classSubject.create({
        data: {
          classId,
          subjectId: subject.id,
        },
      });
    }

    return subject;
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

    return classSubjects.map((cs) => ({
      ...cs.subject,
      isCompulsory: cs.isCompulsory,
      isOptional: cs.isOptional,
      group: cs.group,
    }));
  }

  // নতুন সেকশন তৈরি করা
  async createSection(createSectionDto: CreateSectionDto) {
    return await prisma.section.create({
      data: createSectionDto,
    });
  }

  // সব ক্লাস, সেকশন ও বিষয় ডাটাবেজ থেকে আনা
async getAllClasses() {
  return await prisma.schoolClass.findMany({
    include: {
      sections: true,
      classSubjects: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

}


