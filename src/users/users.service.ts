import { Injectable } from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
    async createUser(data: CreateUserDto) {
        return await prisma.user.create({
            data,
        });
    }
}

