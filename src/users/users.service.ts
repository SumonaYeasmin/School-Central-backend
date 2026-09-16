import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    async createUser(data: CreateUserDto) {
  
    const hashedPassword = await bcrypt.hash(data.password, 10);
   
    return await prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
        },
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

    async updateUser(id: string, data: UpdateUserDto) {
        await this.getUserById(id);

        return await prisma.user.update({
            where: { id },
            data,
        });
    }

    async deleteUser(id: string) {
        await this.getUserById(id);

        return await prisma.user.delete({
            where: { id },
        });
    }
}


