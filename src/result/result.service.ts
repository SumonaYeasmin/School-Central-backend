import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateResultDto } from './dto/create-result.dto.js';
import { UpdateResultDto } from './dto/update-result.dto.js';
import { ResultStatus } from '../generated/prisma/enums.js';

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
      const updatedResult = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
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
        message: 'Result updated successfully',
        result: updatedResult,
      };
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
   * If isPublicView is true (for Parent/Public), it strictly checks if exam is PUBLISHED.
   */
  async getStudentExamResult(
    studentId: string,
    examId: string,
    isPublicView = false,
  ) {
    // 1. Student exists check (supports DB id, studentId code like "S01", and roll number)
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: studentId },
          { studentId: { equals: studentId, mode: 'insensitive' } },
          { roll: studentId },
          { roll: { equals: studentId, mode: 'insensitive' } },
        ],
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

    // 3. Status check: If public/parent view and exam status is DRAFT, deny access
    if (isPublicView && exam.status !== ResultStatus.PUBLISHED) {
      throw new BadRequestException(
        `Results for "${exam.name}" have not been published yet. Status is DRAFT.`,
      );
    }

    // 4. Fetch all subjects belonging to this student's class (Core + Group specific)
    const classSubjects = await prisma.classSubject.findMany({
      where: {
        classId: student.classId,
        ...(student.groupId
          ? {
              OR: [{ groupId: null }, { groupId: student.groupId }],
            }
          : {}),
      },
      include: {
        subject: true,
        group: true,
      },
      orderBy: [
        { isCompulsory: 'desc' },
        { isOptional: 'asc' },
        { subject: { name: 'asc' } },
      ],
    });

    // 5. Fetch all entered subject results for this student in this exam
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

    if (results.length === 0 && isPublicView) {
      throw new NotFoundException(
        'No result found for this student in this exam',
      );
    }

    // Create a fast lookup map for results by subjectId and subject name
    const resultMap = new Map<string, any>();
    results.forEach((r) => {
      resultMap.set(r.subjectId, r);
      if (r.subject?.id) resultMap.set(r.subject.id, r);
      if (r.subject?.name) resultMap.set(r.subject.name.toLowerCase().trim(), r);
    });

    // 6. Build the complete list of subjects for this student's class
    let targetSubjectsList: Array<{
      id: string;
      name: string;
      code: string | null;
      isCompulsory: boolean;
      isOptional: boolean;
    }> = [];

    if (classSubjects.length > 0) {
      targetSubjectsList = classSubjects.map((cs) => ({
        id: cs.subject.id,
        name: cs.subject.name,
        code: cs.subject.code,
        isCompulsory: cs.isCompulsory,
        isOptional: cs.isOptional,
      }));
    } else if (results.length > 0) {
      targetSubjectsList = results.map((r) => ({
        id: r.subject.id,
        name: r.subject.name,
        code: r.subject.code,
        isCompulsory: true,
        isOptional: false,
      }));
    } else {
      const allSubjects = await prisma.subject.findMany({
        orderBy: { name: 'asc' },
      });
      targetSubjectsList = allSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        isCompulsory: true,
        isOptional: false,
      }));
    }

    // Ensure any entered result subject is also included
    const subjectIdSet = new Set(targetSubjectsList.map((s) => s.id));
    for (const r of results) {
      if (r.subject && !subjectIdSet.has(r.subject.id)) {
        targetSubjectsList.push({
          id: r.subject.id,
          name: r.subject.name,
          code: r.subject.code,
          isCompulsory: true,
          isOptional: false,
        });
        subjectIdSet.add(r.subject.id);
      }
    }

    // 7. Calculate Subject Breakdown, Total Marks, Full Marks, and GPA
    let totalMarks = 0;
    let totalFullMarks = 0;
    let totalGpa = 0;
    let enteredCount = 0;

    const subjects = targetSubjectsList.map((sub) => {
      const res =
        resultMap.get(sub.id) ||
        resultMap.get(sub.name.toLowerCase().trim());
      const isEntered = res !== undefined && res !== null;
      const marks = isEntered ? res.marks : null;
      const fullMarks = isEntered ? res.fullMarks : 100;
      const passMarks = 33;

      let grade = '-';
      let gpa = 0;

      if (isEntered && marks !== null) {
        totalMarks += marks;
        totalFullMarks += fullMarks;
        enteredCount++;

        const percentage = (marks / fullMarks) * 100;
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
        totalGpa += gpa;
      } else {
        totalFullMarks += fullMarks;
      }

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        marks,
        fullMarks,
        passMarks,
        grade,
        gpa,
        isEntered,
        isCompulsory: sub.isCompulsory,
        isOptional: sub.isOptional,
      };
    });

    const overallGpa =
      enteredCount > 0 ? Number((totalGpa / enteredCount).toFixed(2)) : 0;

    let overallGrade = '-';
    if (enteredCount > 0) {
      if (overallGpa >= 5.0) overallGrade = 'A+';
      else if (overallGpa >= 4.0) overallGrade = 'A';
      else if (overallGpa >= 3.5) overallGrade = 'A-';
      else if (overallGpa >= 3.0) overallGrade = 'B';
      else if (overallGpa >= 2.0) overallGrade = 'C';
      else if (overallGpa >= 1.0) overallGrade = 'D';
      else overallGrade = 'F';
    }

    // 8. Final response
    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        roll: student.roll,
        class: student.class?.name || null,
        classId: student.classId,
        section: student.section?.name || null,
        sectionId: student.sectionId,
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
      totalSubjects: subjects.length,
      enteredSubjects: enteredCount,
      gpa: overallGpa,
      overallGpa,
      overallGrade,
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
