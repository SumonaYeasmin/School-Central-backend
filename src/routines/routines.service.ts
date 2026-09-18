import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateRoutineDto } from './dto/create-routine.dto.js';

@Injectable()
export class RoutinesService {
  /**
   * Helper function to convert "HH:mm" time string into minutes from midnight
   * Example: "09:45" -> 9 * 60 + 45 = 585
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Create a new class routine slot with full conflict checks
   */
  async createRoutine(createRoutineDto: CreateRoutineDto) {
    const {
      day,
      startTime,
      endTime,
      roomNumber,
      classId,
      sectionId,
      subjectId,
      teacherId,
    } = createRoutineDto;

    // 1. Time Order Validation: startTime must be strictly before endTime
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        `Start time (${startTime}) must be earlier than end time (${endTime})`,
      );
    }

    // 2. Validate that Class, Section, Subject, and Teacher all exist in DB
    const [schoolClass, section, subject, teacher] = await Promise.all([
      prisma.schoolClass.findUnique({ where: { id: classId } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.teacher.findUnique({ where: { id: teacherId } }),
    ]);

    if (!schoolClass) {
      throw new NotFoundException(`Class with ID "${classId}" not found`);
    }
    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }
    if (!subject) {
      throw new NotFoundException(`Subject with ID "${subjectId}" not found`);
    }
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${teacherId}" not found`);
    }

    // 3. Consistency check: Section and Subject must belong to this Class
    if (section.classId !== classId) {
      throw new BadRequestException(
        `Section "${section.name}" does not belong to class "${schoolClass.name}"`,
      );
    }
    if (subject.classId !== classId) {
      throw new BadRequestException(
        `Subject "${subject.name}" does not belong to class "${schoolClass.name}"`,
      );
    }

    // 4. Section Conflict Check: Does this Section already have another class at this time?
    // Overlap condition: (existing.startTime < new.endTime) AND (existing.endTime > new.startTime)
    const sectionConflict = await prisma.classRoutine.findFirst({
      where: {
        day,
        sectionId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        subject: true,
        teacher: true,
      },
    });

    if (sectionConflict) {
      throw new ConflictException(
        `Section "${section.name}" in "${schoolClass.name}" already has "${sectionConflict.subject.name}" class on ${day} from ${sectionConflict.startTime} to ${sectionConflict.endTime} (Teacher: ${sectionConflict.teacher.name})`,
      );
    }

    // 5. Teacher Conflict Check: Does this Teacher already have a class in any section/class at this time?
    const teacherConflict = await prisma.classRoutine.findFirst({
      where: {
        day,
        teacherId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
    });

    if (teacherConflict) {
      throw new ConflictException(
        `Teacher "${teacher.name}" is already assigned to "${teacherConflict.class.name} (${teacherConflict.section.name}) - ${teacherConflict.subject.name}" on ${day} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`,
      );
    }

    // 6. Room Conflict Check (if roomNumber is provided)
    if (roomNumber && roomNumber.trim()) {
      const roomConflict = await prisma.classRoutine.findFirst({
        where: {
          day,
          roomNumber: { equals: roomNumber.trim(), mode: 'insensitive' },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          class: true,
          section: true,
          subject: true,
          teacher: true,
        },
      });

      if (roomConflict) {
        throw new ConflictException(
          `Room "${roomNumber.trim()}" is already booked for "${roomConflict.class.name} (${roomConflict.section.name}) - ${roomConflict.subject.name}" on ${day} from ${roomConflict.startTime} to ${roomConflict.endTime} (Teacher: ${roomConflict.teacher.name})`,
        );
      }
    }

    // 7. If all validations pass, create and return the routine entry
    return await prisma.classRoutine.create({
      data: {
        day,
        startTime,
        endTime,
        roomNumber: roomNumber ? roomNumber.trim() : undefined,
        classId,
        sectionId,
        subjectId,
        teacherId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
    });
  }
}
