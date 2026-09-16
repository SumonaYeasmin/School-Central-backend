import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
    async createUser(data: CreateUserDto) {
        return await prisma.user.create({
            data,
        });
    }
    async getAllUsers() {
        return await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

}

