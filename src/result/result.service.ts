import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateResultDto } from './dto/create-result.dto.js';
import { UpdateResultDto } from './dto/update-result.dto.js';

@Injectable()
export class ResultService {
  /**
   * 1. Create a new student exam result
   */
  async createResult(createResultDto: CreateResultDto) {
    const { studentId, examId, subjectId, marks, fullMarks } = createResultDto;

    // Validate obtained marks vs full marks
    if (marks > fullMarks) {
      throw new BadRequestException(
        `Obtained marks (${marks}) cannot be greater than full marks (${fullMarks})`,
      );
    }

    // Verify student exists (supports both cuid id and studentId code like "S01")
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
      },
    });
    if (!student) {
      throw new NotFoundException(`Student "${studentId}" not found`);
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID "${examId}" not found`);
    }

    // Verify subject exists (supports cuid id, code, or name like "সপ্তবর্ণা")
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

    // Check for duplicate result entry (studentId + examId + subjectId)
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

    // Create result
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
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
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

  /**
   * 2. Get all results with optional filters (exam, student, subject, class, section)
   */
  async getAllResults(filters?: {
    examId?: string;
    studentId?: string;
    subjectId?: string;
    classId?: string;
    sectionId?: string;
  }) {
    const { examId, studentId, subjectId, classId, sectionId } = filters || {};

    let targetStudentId = studentId;
    if (studentId) {
      const matchedStudent = await prisma.student.findFirst({
        where: {
          OR: [{ id: studentId }, { studentId: studentId }],
        },
      });
      if (matchedStudent) {
        targetStudentId = matchedStudent.id;
      }
    }

    let targetSubjectId = subjectId;
    if (subjectId) {
      const matchedSubject = await prisma.subject.findFirst({
        where: {
          OR: [
            { id: subjectId },
            { code: subjectId },
            { name: subjectId },
            { name: { equals: subjectId, mode: 'insensitive' } },
          ],
        },
      });
      if (matchedSubject) {
        targetSubjectId = matchedSubject.id;
      }
    }

    const results = await prisma.result.findMany({
      where: {
        examId: examId || undefined,
        studentId: targetStudentId || undefined,
        subjectId: targetSubjectId || undefined,
        student:
          classId || sectionId
            ? {
                classId: classId || undefined,
                sectionId: sectionId || undefined,
              }
            : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            roll: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
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
      orderBy: [{ createdAt: 'desc' }],
    });

    return results;
  }

  /**
   * 3. Get single student complete exam result (with GPA, Grades, and Subject Breakdown)
   */
  async getStudentExamResult(studentId: string, examId: string) {
    // 1. Student exists check (supports both DB id and studentId code like "S01")
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
      },
      include: {
        class: true,
        section: true,
        group: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student "${studentId}" not found`);
    }

    // 2. Exam exists check
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID "${examId}" not found`);
    }

    // 3. Fetch all subject results for this student in this exam
    const results = await prisma.result.findMany({
      where: {
        studentId: student.id,
        examId: exam.id,
      },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    if (results.length === 0) {
      throw new NotFoundException(
        'No result found for this student in this exam',
      );
    }

    // 4. Total marks and total full marks
    let totalMarks = 0;
    let totalFullMarks = 0;

    for (const result of results) {
      totalMarks += result.marks;
      totalFullMarks += result.fullMarks;
    }

    // 5. Calculate Grade and GPA for each subject
    const subjects = results.map((result) => {
      const percentage = (result.marks / result.fullMarks) * 100;

      let grade = '';
      let gpa = 0;

      if (percentage >= 80) {
        grade = 'A+';
        gpa = 5;
      } else if (percentage >= 70) {
        grade = 'A';
        gpa = 4;
      } else if (percentage >= 60) {
        grade = 'A-';
        gpa = 3.5;
      } else if (percentage >= 50) {
        grade = 'B';
        gpa = 3;
      } else if (percentage >= 40) {
        grade = 'C';
        gpa = 2;
      } else if (percentage >= 33) {
        grade = 'D';
        gpa = 1;
      } else {
        grade = 'F';
        gpa = 0;
      }

      return {
        subjectId: result.subjectId,
        subjectName: result.subject.name,
        marks: result.marks,
        fullMarks: result.fullMarks,
        grade,
        gpa,
      };
    });

    // 6. Overall GPA calculation
    let totalGpa = 0;

    for (const subject of subjects) {
      totalGpa += subject.gpa;
    }

    const overallGpa = Number((totalGpa / subjects.length).toFixed(2));

    // 7. Final response
    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        class: student.class?.name || null,
        section: student.section?.name || null,
        group: student.group?.name ?? null,
      },

      exam: {
        id: exam.id,
        name: exam.name,
        year: exam.year,
        status: exam.status,
      },

      subjects,

      totalMarks,
      totalFullMarks,
      gpa: overallGpa,
    };
  }

  /**
   * 4. Get single result by ID
   */
  async getResultById(id: string) {
    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            roll: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
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

    if (!result) {
      throw new NotFoundException(`Result with ID "${id}" not found`);
    }

    return result;
  }

  /**
   * 5. Update marks or fullMarks for an existing result
   */
  async updateResult(id: string, updateResultDto: UpdateResultDto) {
    const existing = await prisma.result.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Result with ID "${id}" not found`);
    }

    const marks =
      updateResultDto.marks !== undefined
        ? updateResultDto.marks
        : existing.marks;
    const fullMarks =
      updateResultDto.fullMarks !== undefined
        ? updateResultDto.fullMarks
        : existing.fullMarks;

    if (marks > fullMarks) {
      throw new BadRequestException(
        `Obtained marks (${marks}) cannot be greater than full marks (${fullMarks})`,
      );
    }

    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        marks: updateResultDto.marks !== undefined ? updateResultDto.marks : undefined,
        fullMarks: updateResultDto.fullMarks !== undefined ? updateResultDto.fullMarks : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            roll: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
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
      message: 'Result updated successfully',
      result: updatedResult,
    };
  }

  /**
   * 6. Delete a result entry
   */
  async deleteResult(id: string) {
    const existing = await prisma.result.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Result with ID "${id}" not found`);
    }

    await prisma.result.delete({
      where: { id },
    });

    return {
      message: 'Result deleted successfully',
    };
  }
}
