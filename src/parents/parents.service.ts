import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';

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
}
