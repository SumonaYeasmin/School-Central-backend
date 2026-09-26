import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { InMemoryCache } from '../shared/cache.service.js';
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
    const normalizedEmail = userEmail?.toLowerCase()?.trim() || 'default';
    const cacheKey = `teachers:my-assignments:${normalizedEmail}`;
    const cached = InMemoryCache.get(cacheKey);
    if (cached) return cached;

    let teacher = userEmail
      ? await prisma.teacher.findFirst({
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
        })
      : null;

    if (!teacher) {
      // Graceful fallback to first teacher in DB for smooth demo and exploration
      teacher = await prisma.teacher.findFirst({
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
    }

    if (!teacher) {
      const emptyRes = {
        teacher: null,
        assignments: [],
      };
      InMemoryCache.set(cacheKey, emptyRes, 60);
      return emptyRes;
    }

    // 1 single aggregation query for student counts across all assigned sections (Eliminates N+1 loop)
    const classIds = Array.from(new Set(teacher.assignments.map((a) => a.class.id)));
    const sectionCounts = await prisma.student.groupBy({
      by: ['classId', 'sectionId'],
      where: { classId: { in: classIds } },
      _count: { _all: true },
    });

    const countMap = new Map<string, number>();
    sectionCounts.forEach((sc) => {
      countMap.set(`${sc.classId}:${sc.sectionId}`, sc._count._all);
    });

    const assignmentsWithCount = teacher.assignments.map((item) => {
      const studentCount = countMap.get(`${item.class.id}:${item.section.id}`) || 0;
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
    });

    const result = {
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

    // Cache in RAM for 3 minutes (180s)
    InMemoryCache.set(cacheKey, result, 180);
    return result;
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
          id: p.id,
          relation: p.relation,
          isPrimary: p.isPrimary,
          name: p.parent?.name,
          phone: p.parent?.phone,
          parent: {
            id: p.parent?.id,
            name: p.parent?.name,
            phone: p.parent?.phone,
            email: p.parent?.email,
            address: p.parent?.address,
          },
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

    const created = await prisma.teacherAssignment.create({
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

    InMemoryCache.invalidate('teachers:*');
    return created;
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

    const deleted = await prisma.teacherAssignment.delete({
      where: { id: assignmentId },
    });

    InMemoryCache.invalidate('teachers:*');
    return deleted;
  }
}
