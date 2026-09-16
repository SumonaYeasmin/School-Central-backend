
import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';

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

  // সাবজেক্ট তৈরি
async createSubject(createSubjectDto: CreateSubjectDto) {
  return await prisma.subject.create({
    data: createSubjectDto,
  });
}

// কোনো ক্লাসের সব সাবজেক্ট দেখা
async getSubjectsByClass(classId: string) {
  return await prisma.subject.findMany({
    where: { classId },
  });
}

}


