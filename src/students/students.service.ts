
import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

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

  async getAllStudents(classId?: string, sectionId?: string) {
    return await prisma.student.findMany({
      where: {
        classId: classId || undefined,
        sectionId: sectionId || undefined,
      },
      include: {
        class: true,
        section: true,
      },
      orderBy: {
        roll: 'asc',
      },
    });
  }

  async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async updateStudent(id: string, updateStudentDto: UpdateStudentDto) {
    await this.getStudentById(id);

    const { dateOfBirth, admissionDate, ...rest } = updateStudentDto;

    return await prisma.student.update({
      where: { id },
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

  async deleteStudent(id: string) {
    await this.getStudentById(id);

    return await prisma.student.delete({
      where: { id },
    });
  }
}




