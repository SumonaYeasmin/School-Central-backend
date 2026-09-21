import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateResultDto } from './dto/create-result.dto.js';

@Injectable()
export class ResultService {
  /**
   * Create a new student exam result
   */
  async createResult(createResultDto: CreateResultDto) {
    const { studentId, examId, subjectId, marks } = createResultDto;

    // 1. Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found`);
    }

    // 2. Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID "${examId}" not found`);
    }

    // 3. Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID "${subjectId}" not found`);
    }

    // 4. Check for duplicate result entry (studentId + examId + subjectId)
    const existingResult = await prisma.result.findUnique({
      where: {
        studentId_examId_subjectId: {
          studentId,
          examId,
          subjectId,
        },
      },
    });

    if (existingResult) {
      throw new ConflictException(
        'Result already exists for this student, exam, and subject',
      );
    }

    // 5. Create result
    const result = await prisma.result.create({
      data: {
        studentId,
        examId,
        subjectId,
        marks,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            roll: true,
          },
        },
        exam: {
          select: {
            id: true,
            name: true,
            year: true,
            status: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: 'Result created successfully',
      result,
    };
  }
}
