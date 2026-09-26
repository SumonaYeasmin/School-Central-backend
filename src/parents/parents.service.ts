import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import prisma from '../shared/prisma.js';
import { MailService } from '../mail/mail.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';
import { AssignStudentDto } from './dto/assign-student.dto.js';

@Injectable()
export class ParentsService {
  constructor(private readonly mailService: MailService) {}

  async createParent(createParentDto: CreateParentDto) {
    const { email, ...rest } = createParentDto;

    // 1. Check if email already exists
    if (email) {
      const existing = await prisma.parent.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (existing) {
        throw new ConflictException(`Parent with email "${email}" already exists`);
      }
    }

    // 2. Create Parent in database
    const parent = await prisma.parent.create({
      data: {
        ...rest,
        email: email || undefined,
      },
    });

    // 3. If email provided, create User account and dispatch credentials email
    if (parent.email) {
      const temporaryPassword = 'Par@' + Math.floor(1000 + Math.random() * 9000);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      await prisma.user.upsert({
        where: { email: parent.email },
        update: { password: hashedPassword, role: 'PARENT' },
        create: {
          name: parent.name,
          email: parent.email,
          password: hashedPassword,
          role: 'PARENT',
        },
      });

      this.mailService
        .sendParentCredentials(
          parent.email,
          parent.name,
          temporaryPassword,
        )
        .catch((err) => console.error('Parent email dispatch error:', err));
    }

    return parent;
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

    const cleanPhone = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;

    const parent = await prisma.parent.findFirst({
      where: {
        OR: [
          { email: { equals: userEmail, mode: 'insensitive' } },
          { phone: userEmail },
          { phone: cleanPhone },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: {
                  include: {
                    classSubjects: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
                section: {
                  include: {
                    teacherAssignments: {
                      where: { isClassTeacher: true },
                      include: { teacher: true },
                    },
                  },
                },
                group: true,
                parents: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(
        `Parent profile not found with identifier: ${userEmail}. Please ensure parent profile has matching email or phone.`,
      );
    }

    return {
      parentId: parent.id,
      parentName: parent.name,
      phone: parent.phone,
      email: parent.email,
      address: parent.address,
      totalChildren: parent.students.length,
      children: parent.students.map((ps) => {
        const student = ps.student;
        const classTeacherAssignment = student.section.teacherAssignments.find(
          (ta) => ta.isClassTeacher,
        );

        return {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          photo: student.photo,
          admissionDate: student.admissionDate,
          class: student.class.name,
          classId: student.classId,
          section: student.section.name,
          sectionId: student.sectionId,
          group: student.group?.name ?? null,
          roll: student.roll,
          relation: ps.relation,
          isPrimaryContact: ps.isPrimary,
          status: student.status,
          classTeacher: classTeacherAssignment
            ? {
                name: classTeacherAssignment.teacher.name,
                designation: classTeacherAssignment.teacher.designation,
                phone: classTeacherAssignment.teacher.phone,
                email: classTeacherAssignment.teacher.email,
              }
            : null,
          guardians: student.parents.map((p) => ({
            id: p.parent.id,
            name: p.parent.name,
            relation: p.relation,
            phone: p.parent.phone,
            email: p.parent.email,
            address: p.parent.address,
            isPrimary: p.isPrimary,
          })),
          subjects: student.class.classSubjects.map((cs) => ({
            id: cs.subject.id,
            name: cs.subject.name,
            code: cs.subject.code,
            isCompulsory: cs.isCompulsory,
            isOptional: cs.isOptional,
          })),
        };
      }),
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
    const parent = await prisma.parent.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID "${id}" not found`);
    }

    const operations: Promise<any>[] = [
      prisma.parent.delete({
        where: { id },
      }),
    ];

    if (parent.email) {
      operations.push(
        prisma.user
          .deleteMany({
            where: { email: parent.email, role: 'PARENT' },
          })
          .catch(() => {}),
      );
    }

    const [deleted] = await Promise.all(operations);
    return deleted;
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
