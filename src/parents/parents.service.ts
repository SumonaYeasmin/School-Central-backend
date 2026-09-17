import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';
import { AssignStudentDto } from './dto/assign-student.dto.js';

@Injectable()
export class ParentsService {
  async createParent(createParentDto: CreateParentDto) {
    return await prisma.parent.create({
      data: createParentDto,
    });
  }

  async getAllParents(search?: string) {
    return await prisma.parent.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMyChildren(userEmail?: string) {
    if (!userEmail) {
      throw new NotFoundException('Parent email is required');
    }

    const parent = await prisma.parent.findFirst({
      where: {
        email: { equals: userEmail, mode: 'insensitive' },
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(
        `Parent profile not found with email: ${userEmail}. Please ensure parent profile has matching email.`,
      );
    }

    return {
      parentId: parent.id,
      parentName: parent.name,
      phone: parent.phone,
      totalChildren: parent.students.length,
      children: parent.students.map((ps) => ({
        id: ps.student.id,
        studentId: ps.student.studentId,
        name: ps.student.name,
        gender: ps.student.gender,
        class: ps.student.class.name,
        section: ps.student.section.name,
        roll: ps.student.roll,
        relation: ps.relation,
        isPrimaryContact: ps.isPrimary,
        status: ps.student.status,
      })),
    };
  }

  async getParentById(id: string) {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID "${id}" not found`);
    }

    return parent;
  }

  async updateParent(id: string, updateParentDto: UpdateParentDto) {
    await this.getParentById(id);

    return await prisma.parent.update({
      where: { id },
      data: updateParentDto,
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteParent(id: string) {
    await this.getParentById(id);

    return await prisma.parent.delete({
      where: { id },
    });
  }

  async assignStudent(parentId: string, assignStudentDto: AssignStudentDto) {
    await this.getParentById(parentId);

    const { studentId, relation, isPrimary } = assignStudentDto;

    // Check if student exists (by database ID or custom studentId)
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found`);
    }

    // Check if this parent is already linked to this student
    const existingRelation = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException(
        'This parent is already linked to this student',
      );
    }

    // If marked as primary contact, reset other primary contacts for this student
    if (isPrimary) {
      await prisma.parentStudent.updateMany({
        where: { studentId: student.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return await prisma.parentStudent.create({
      data: {
        parentId,
        studentId: student.id,
        relation,
        isPrimary: isPrimary ?? false,
      },
      include: {
        parent: true,
        student: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });
  }

  async removeStudent(parentId: string, studentId: string) {
    await this.getParentById(parentId);

    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found`);
    }

    const existingRelation = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id,
        },
      },
    });

    if (!existingRelation) {
      throw new NotFoundException(
        'Relation between this parent and student does not exist',
      );
    }

    return await prisma.parentStudent.delete({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id,
        },
      },
    });
  }
}
