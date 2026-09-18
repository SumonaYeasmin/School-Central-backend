  import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';

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
}
