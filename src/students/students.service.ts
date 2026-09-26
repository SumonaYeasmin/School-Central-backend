
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { InMemoryCache } from '../shared/cache.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

@Injectable()
export class StudentsService {
    async createStudent(createStudentDto: CreateStudentDto) {
        const { dateOfBirth, admissionDate, classId, sectionId, studentId, roll, ...rest } =
            createStudentDto;

        // 1. Check if class exists
        const schoolClass = await prisma.schoolClass.findUnique({
            where: { id: classId },
        });
        if (!schoolClass) {
            throw new NotFoundException(`Class with ID "${classId}" not found`);
        }

        // 2. Check if section exists and belongs to this class
        const section = await prisma.section.findUnique({
            where: { id: sectionId },
        });
        if (!section) {
            throw new NotFoundException(`Section with ID "${sectionId}" not found`);
        }
        if (section.classId !== classId) {
            throw new BadRequestException(
                `Section "${section.name}" does not belong to class "${schoolClass.name}"`,
            );
        }

        // 3. Check if studentId is already taken
        const existingStudentId = await prisma.student.findUnique({
            where: { studentId },
        });
        if (existingStudentId) {
            throw new ConflictException(`Student with studentId "${studentId}" already exists`);
        }

        // 4. Check if roll is already taken in this class & section
        const existingRoll = await prisma.student.findUnique({
            where: {
                classId_sectionId_roll: {
                    classId,
                    sectionId,
                    roll,
                },
            },
        });
        if (existingRoll) {
            throw new ConflictException(
                `A student with Roll "${roll}" already exists in this class and section`,
            );
        }

        const created = await prisma.student.create({
            data: {
                ...rest,
                studentId,
                roll,
                classId,
                sectionId,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
            },
            include: {
                class: true,
                section: true,
            },
        });

        InMemoryCache.invalidate('students:*');
        return created;
    }

    async getAllStudents(classId?: string, sectionId?: string) {
        const cacheKey = `students:${classId || 'all'}:${sectionId || 'all'}`;
        const cached = InMemoryCache.get(cacheKey);
        if (cached) return cached;

        const students = await prisma.student.findMany({
            where: {
                classId: classId || undefined,
                sectionId: sectionId || undefined,
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

        InMemoryCache.set(cacheKey, students, 120); // 2 mins
        return students;
    }

    async getStudentById(id: string) {
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                class: true,
                section: true,
                parents: {
                    include: {
                        parent: true,
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException(`Student with ID "${id}" not found`);
        }

        return student;
    }

    async updateStudent(id: string, updateStudentDto: UpdateStudentDto) {
        const existingStudent = await this.getStudentById(id);

        const { dateOfBirth, admissionDate, classId, sectionId, studentId, roll, ...rest } =
            updateStudentDto;

        const targetClassId = classId ?? existingStudent.classId;
        const targetSectionId = sectionId ?? existingStudent.sectionId;
        const targetRoll = roll ?? existingStudent.roll;

        // 1. If classId is being changed, verify it exists
        if (classId && classId !== existingStudent.classId) {
            const schoolClass = await prisma.schoolClass.findUnique({
                where: { id: classId },
            });
            if (!schoolClass) {
                throw new NotFoundException(`Class with ID "${classId}" not found`);
            }
        }

        // 2. If sectionId or classId is updated, verify section exists & belongs to class
        if (sectionId || classId) {
            const section = await prisma.section.findUnique({
                where: { id: targetSectionId },
            });
            if (!section) {
                throw new NotFoundException(`Section with ID "${targetSectionId}" not found`);
            }
            if (section.classId !== targetClassId) {
                throw new BadRequestException(
                    `Section with ID "${targetSectionId}" does not belong to the target class`,
                );
            }
        }

        // 3. If studentId is being changed, verify uniqueness
        if (studentId && studentId !== existingStudent.studentId) {
            const conflictStudentId = await prisma.student.findUnique({
                where: { studentId },
            });
            if (conflictStudentId) {
                throw new ConflictException(`Student with studentId "${studentId}" already exists`);
            }
        }

        // 4. If class, section, or roll changes, check uniqueness of the roll
        if (
            targetClassId !== existingStudent.classId ||
            targetSectionId !== existingStudent.sectionId ||
            targetRoll !== existingStudent.roll
        ) {
            const conflictRoll = await prisma.student.findUnique({
                where: {
                    classId_sectionId_roll: {
                        classId: targetClassId,
                        sectionId: targetSectionId,
                        roll: targetRoll,
                    },
                },
            });
            if (conflictRoll && conflictRoll.id !== id) {
                throw new ConflictException(
                    `A student with Roll "${targetRoll}" already exists in the target class and section`,
                );
            }
        }

        return await prisma.student.update({
            where: { id },
            data: {
                ...rest,
                studentId: studentId ?? undefined,
                roll: roll ?? undefined,
                classId: classId ?? undefined,
                sectionId: sectionId ?? undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
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
        });
    }

    async deleteStudent(id: string) {
        await this.getStudentById(id);

        return await prisma.student.delete({
            where: { id },
        });
    }
}





