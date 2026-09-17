import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateParentDto } from './dto/create-parent.dto.js';

@Injectable()
export class ParentsService {
  async createParent(createParentDto: CreateParentDto) {
    return await prisma.parent.create({
      data: createParentDto,
    });
  }
}
