import { ConflictException, Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateExamDto } from './dto/creat-exam.dto.js';
import { ExamStatus } from '../generated/prisma/enums.js';

@Injectable()
export class ExamService {
  /**
   * Create a new Exam
   */
  async createExam(createExamDto: CreateExamDto) {
    const { name, year, status } = createExamDto;

    // Check if exam with the same name and year already exists
    const existingExam = await prisma.exam.findUnique({
      where: {
        name_year: {
          name: name.trim(),
          year,
        },
      },
    });

    if (existingExam) {
      throw new ConflictException(
        `Exam "${name.trim()}" for year ${year} already exists`,
      );
    }

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        year,
        status: status || ExamStatus.DRAFT,
        publishedAt: status === ExamStatus.PUBLISHED ? new Date() : null,
      },
    });

    return {
      message: 'Exam created successfully',
      exam,
    };
  }

  /**
   * Get all Exams
   */
  async getAllExams() {
    return prisma.exam.findMany({
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
