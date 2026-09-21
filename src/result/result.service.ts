import {
  BadRequestException,
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
    const { studentId, examId, subjectId, marks, fullMarks } = createResultDto;

    // 1. Validate obtained marks vs full marks
    if (marks > fullMarks) {
      throw new BadRequestException(
        `Obtained marks (${marks}) cannot be greater than full marks (${fullMarks})`,
      );
    }

    // 2. Verify student exists (supports both cuid id and studentId code like "S01")
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
      },
    });
    if (!student) {
      throw new NotFoundException(`Student "${studentId}" not found`);
    }

    // 3. Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID "${examId}" not found`);
    }

    // 4. Verify subject exists (supports cuid id, code, or name like "সপ্তবর্ণা")
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: subjectId },
          { code: subjectId },
          { name: subjectId },
          { name: { equals: subjectId, mode: 'insensitive' } },
        ],
      },
    });
    if (!subject) {
      throw new NotFoundException(`Subject "${subjectId}" not found`);
    }

    // 5. Check for duplicate result entry (studentId + examId + subjectId)
    const existingResult = await prisma.result.findUnique({
      where: {
        studentId_examId_subjectId: {
          studentId: student.id,
          examId: exam.id,
          subjectId: subject.id,
        },
      },
    });

    if (existingResult) {
      throw new ConflictException(
        'Result already exists for this student, exam, and subject',
      );
    }

    // 6. Create result
    const result = await prisma.result.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        subjectId: subject.id,
        marks,
        fullMarks,
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
