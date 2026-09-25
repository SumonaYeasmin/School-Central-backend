// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import prisma from '../shared/prisma.js';
import { LoginDto } from './dto/login.dto.js';
import { UserRole } from '../generated/prisma/enums.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const { email: identifier, password } = loginDto;

    // 1. Find user by email directly
    let user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    // If not found, check if identifier is a teacherId or email in Teacher table
    if (!user) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { teacherId: { equals: identifier, mode: 'insensitive' } },
            { email: { equals: identifier, mode: 'insensitive' } },
          ],
        },
      });

      if (teacher) {
        const teacherEmail = teacher.email || `${teacher.teacherId.toLowerCase()}@school.com`;
        user = await prisma.user.findUnique({
          where: { email: teacherEmail },
        });

        // Auto-provision User login record for teacher if needed
        if (!user) {
          const hashedPassword = await bcrypt.hash('123456', 10);
          user = await prisma.user.create({
            data: {
              name: teacher.name,
              email: teacherEmail,
              password: hashedPassword,
              role: UserRole.TEACHER,
            },
          });
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email, teacher ID, or password');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email, teacher ID, or password');
    }

    // 3. If user is a TEACHER, fetch their teacher details
    let teacherInfo: any = null;
    if (user.role === UserRole.TEACHER) {
      teacherInfo = await prisma.teacher.findFirst({
        where: {
          email: { equals: user.email, mode: 'insensitive' },
        },
        select: {
          id: true,
          teacherId: true,
          name: true,
          phone: true,
          designation: true,
          department: true,
        },
      });
    }

    // 4. Generate JWT Token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      teacherId: teacherInfo?.teacherId,
    };

    return {
      message: 'Login successful',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: teacherInfo?.name || user.name,
        email: user.email,
        role: user.role,
        teacherId: teacherInfo?.teacherId,
        designation: teacherInfo?.designation,
        department: teacherInfo?.department,
        phone: teacherInfo?.phone,
      },
    };
  }

  async getProfile(userId?: string, email?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          userId ? { id: userId } : {},
          email ? { email } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If PARENT, attach only personal contact info (phone, address) - NOT children
    let parentDetails = null;
    if (user.role === UserRole.PARENT) {
      parentDetails = await prisma.parent.findFirst({
        where: {
          email: { equals: user.email, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
        },
      });
    }

    // If TEACHER, attach teacher profile info (designation, department, teacherId, phone)
    let teacherDetails = null;
    if (user.role === UserRole.TEACHER) {
      teacherDetails = await prisma.teacher.findFirst({
        where: {
          email: { equals: user.email, mode: 'insensitive' },
        },
        select: {
          id: true,
          teacherId: true,
          phone: true,
          designation: true,
          department: true,
          joiningDate: true,
        },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: parentDetails?.phone ?? teacherDetails?.phone ?? undefined,
      address: parentDetails?.address ?? undefined,
      teacherId: teacherDetails?.teacherId ?? undefined,
      designation: teacherDetails?.designation ?? undefined,
      department: teacherDetails?.department ?? undefined,
      joiningDate: teacherDetails?.joiningDate ?? undefined,
      createdAt: user.createdAt,
    };
  }
}
