
import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateStudentDto } from './dto/create-student.dto.js';

@Injectable()
export class StudentsService {
  async createStudent(createStudentDto: CreateStudentDto) {
    const { dateOfBirth, admissionDate, ...rest } = createStudentDto;

    return await prisma.student.create({
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      },
      include: {
        class: true,
        section: true,
      },
    });
  }
}

