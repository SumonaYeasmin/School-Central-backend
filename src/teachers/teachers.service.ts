import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { AssignTeacherDto } from './dto/assign-teacher.dto.js';

@Injectable()
export class TeachersService {
  async createTeacher(createTeacherDto: CreateTeacherDto) {
    const { teacherId, email, joiningDate, ...rest } = createTeacherDto;

    // 1. Check if teacherId already exists
    const existingTeacherId = await prisma.teacher.findUnique({
      where: { teacherId },
    });
    if (existingTeacherId) {
      throw new ConflictException(`Teacher with ID "${teacherId}" already exists`);
    }

    // 2. Check if email already exists
    if (email) {
      const existingEmail = await prisma.teacher.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException(`Teacher with email "${email}" already exists`);
      }
    }

    return await prisma.teacher.create({
      data: {
        ...rest,
        teacherId,
        email: email || undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      },
      include: {
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });
  }

  async getAllTeachers(search?: string, department?: string) {
    return await prisma.teacher.findMany({
      where: {
        department: department || undefined,
        OR: search
          ? [
            { name: { contains: search, mode: 'insensitive' } },
            { teacherId: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
          ]
          : undefined,
      },
      include: {
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMyAssignments(userEmail?: string) {
    if (!userEmail) {
      throw new BadRequestException('Teacher email is required');
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email: { equals: userEmail, mode: 'insensitive' } },
          { teacherId: { equals: userEmail, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(
        `Teacher profile not found with identifier: ${userEmail}`,
      );
    }

    const assignmentsWithCount = await Promise.all(
      teacher.assignments.map(async (item) => {
        const studentCount = await prisma.student.count({
          where: {
            classId: item.class.id,
            sectionId: item.section.id,
          },
        });
        return {
          id: item.id,
          class: {
            id: item.class.id,
            name: item.class.name,
          },
          section: {
            id: item.section.id,
            name: item.section.name,
          },
          subject: {
            id: item.subject.id,
            name: item.subject.name,
            code: item.subject.code,
          },
          studentCount,
          createdAt: item.createdAt,
        };
      }),
    );

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        teacherId: teacher.teacherId,
        email: teacher.email,
        phone: teacher.phone,
        designation: teacher.designation,
        department: teacher.department,
      },
      assignments: assignmentsWithCount,
    };
  }

  async getAssignmentStudents(assignmentId: string) {
    const assignment = await prisma.teacherAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Teacher assignment with ID "${assignmentId}" not found`,
      );
    }

    const students = await prisma.student.findMany({
      where: {
        classId: assignment.classId,
        sectionId: assignment.sectionId,
      },
      include: {
        class: true,
        section: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: {
        roll: 'asc',
      },
    });

    return {
      assignment: {
        id: assignment.id,
        teacherName: assignment.teacher.name,
        className: assignment.class.name,
        sectionName: assignment.section.name,
        subjectName: assignment.subject.name,
        isClassTeacher: assignment.isClassTeacher,
      },
      totalStudents: students.length,
      students: students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        gender: s.gender,
        photo: s.photo,
        roll: s.roll,
        status: s.status,
        class: {
          id: s.class.id,
          name: s.class.name,
        },
        section: {
          id: s.section.id,
          name: s.section.name,
        },
        parents: s.parents.map((p) => ({
          id: p.parent.id,
          name: p.parent.name,
          phone: p.parent.phone,
          relation: p.relation,
          isPrimary: p.isPrimary,
        })),
      })),
    };
  }

  async getTeacherById(id: string) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ id }, { teacherId: id }],
      },
      include: {
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }

    return teacher;
  }

  async updateTeacher(id: string, updateTeacherDto: UpdateTeacherDto) {
    const existingTeacher = await this.getTeacherById(id);

    const { teacherId, email, joiningDate, ...rest } = updateTeacherDto;

    // 1. Check unique teacherId if changing
    if (teacherId && teacherId !== existingTeacher.teacherId) {
      const conflictId = await prisma.teacher.findUnique({
        where: { teacherId },
      });
      if (conflictId) {
        throw new ConflictException(`Teacher ID "${teacherId}" is already in use`);
      }
    }

    // 2. Check unique email if changing
    if (email && email !== existingTeacher.email) {
      const conflictEmail = await prisma.teacher.findUnique({
        where: { email },
      });
      if (conflictEmail) {
        throw new ConflictException(`Email "${email}" is already in use`);
      }
    }

    return await prisma.teacher.update({
      where: { id: existingTeacher.id },
      data: {
        ...rest,
        teacherId: teacherId ?? undefined,
        email: email ?? undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      },
      include: {
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });
  }

  async deleteTeacher(id: string) {
    const existingTeacher = await this.getTeacherById(id);

    return await prisma.teacher.delete({
      where: { id: existingTeacher.id },
    });
  }

  async assignTeacher(teacherId: string, assignDto: AssignTeacherDto) {
    const teacher = await this.getTeacherById(teacherId);

    const { classId, sectionId, subjectId, isClassTeacher } = assignDto;

    // 1. Validate that class, section, and subject exist
    const [schoolClass, section, subject] = await Promise.all([
      prisma.schoolClass.findUnique({ where: { id: classId } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
    ]);

    if (!schoolClass) {
      throw new NotFoundException(`Class with ID "${classId}" not found`);
    }
    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }
    if (!subject) {
      throw new NotFoundException(`Subject with ID "${subjectId}" not found`);
    }

    // 2. Check if section and subject belong to the target class
    if (section.classId !== classId) {
      throw new BadRequestException(
        `Section "${section.name}" does not belong to class "${schoolClass.name}"`,
      );
    }
    const classSubject = await prisma.classSubject.findFirst({
      where: { classId, subjectId },
    });
    if (!classSubject) {
      throw new BadRequestException(
        `Subject "${subject.name}" is not assigned to class "${schoolClass.name}"`,
      );
    }

    // 3. Check if this subject in this section is already assigned to a teacher
    const existingAssignment = await prisma.teacherAssignment.findUnique({
      where: {
        classId_sectionId_subjectId: {
          classId,
          sectionId,
          subjectId,
        },
      },
      include: {
        teacher: true,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Subject "${subject.name}" in ${schoolClass.name} (Section ${section.name}) is already assigned to "${existingAssignment.teacher.name}"`,
      );
    }

    return await prisma.teacherAssignment.create({
      data: {
        teacherId: teacher.id,
        classId,
        sectionId,
        subjectId,
        isClassTeacher: isClassTeacher ?? false,
      },
      include: {
        teacher: true,
        class: true,
        section: true,
        subject: true,
      },
    });
  }

  async removeAssignment(assignmentId: string) {
    const assignment = await prisma.teacherAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Teacher assignment with ID "${assignmentId}" not found`,
      );
    }

    return await prisma.teacherAssignment.delete({
      where: { id: assignmentId },
    });
  }
}
