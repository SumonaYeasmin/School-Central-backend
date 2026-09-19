import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { CreateRoutineDto } from './dto/create-routine.dto.js';
import { UpdateRoutineDto } from './dto/update-routine.dto.js';
import { DayOfWeek } from '../generated/prisma/enums.js';

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
    const classSubject = await prisma.classSubject.findFirst({
      where: { classId, subjectId },
    });
    if (!classSubject) {
      throw new BadRequestException(
        `Subject "${subject.name}" is not assigned to class "${schoolClass.name}"`,
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

  /**
   * Get routines with flexible filters.
   * Admin can see:
   * - Full week routine (when day is not provided)
   * - Specific day routine (when day is provided, e.g. SUNDAY)
   * - Filter by classId, sectionId, teacherId, subjectId
   */
  async getAllRoutines(
    day?: DayOfWeek,
    classId?: string,
    sectionId?: string,
    teacherId?: string,
    subjectId?: string,
  ) {
    const routines = await prisma.classRoutine.findMany({
      where: {
        day: day || undefined,
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        teacherId: teacherId || undefined,
        subjectId: subjectId || undefined,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
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
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return {
      filterApplied: {
        day: day || 'FULL_WEEK (ALL_DAYS)',
        classId: classId || 'ALL_CLASSES',
        sectionId: sectionId || 'ALL_SECTIONS',
        teacherId: teacherId || 'ALL_TEACHERS',
        subjectId: subjectId || 'ALL_SUBJECTS',
      },
      totalSlots: routines.length,
      routines,
    };
  }

  /**
   * Get visual weekly timetable grid for a specific class & section
   * Grouped day-by-day (Sunday to Saturday) or for a specific day
   */
  async getWeeklyTimetable(classId: string, sectionId: string, day?: DayOfWeek) {
    const [schoolClass, section] = await Promise.all([
      prisma.schoolClass.findUnique({ where: { id: classId } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
    ]);

    if (!schoolClass) {
      throw new NotFoundException(`Class with ID "${classId}" not found`);
    }
    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }

    const routines = await prisma.classRoutine.findMany({
      where: {
        classId,
        sectionId,
        day: day || undefined,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            designation: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const daysList: DayOfWeek[] = day
      ? [day]
      : [
          DayOfWeek.SUNDAY,
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
          DayOfWeek.SATURDAY,
        ];

    const timetable: Record<string, any[]> = {};

    for (const d of daysList) {
      timetable[d] = routines
        .filter((r) => r.day === d)
        .map((r) => ({
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          roomNumber: r.roomNumber,
          subject: r.subject,
          teacher: r.teacher,
        }));
    }

    return {
      class: { id: schoolClass.id, name: schoolClass.name },
      section: { id: section.id, name: section.name },
      viewMode: day ? `SINGLE_DAY (${day})` : 'FULL_WEEK',
      totalPeriods: routines.length,
      timetable,
    };
  }

  /**
   * Get single routine slot details by ID
   */
  async getRoutineById(id: string) {
    const routine = await prisma.classRoutine.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            email: true,
            phone: true,
            designation: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine slot with ID "${id}" not found`);
    }

    return routine;
  }

  /**
   * Get logged-in teacher's routine schedule (Full week or specific day)
   */
  async getMyRoutine(userEmail?: string, day?: DayOfWeek) {
    if (!userEmail) {
      throw new BadRequestException('Teacher email is required');
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        email: { equals: userEmail, mode: 'insensitive' },
      },
    });

    if (!teacher) {
      throw new NotFoundException(
        `Teacher profile not found with email: ${userEmail}`,
      );
    }

    const routines = await prisma.classRoutine.findMany({
      where: {
        teacherId: teacher.id,
        day: day || undefined,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Grouping by days for organized view
    const daysList: DayOfWeek[] = day
      ? [day]
      : [
          DayOfWeek.SUNDAY,
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
          DayOfWeek.SATURDAY,
        ];

    const weeklySchedule: Record<string, any[]> = {};
    for (const d of daysList) {
      weeklySchedule[d] = routines
        .filter((r) => r.day === d)
        .map((r) => ({
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          roomNumber: r.roomNumber,
          class: r.class.name,
          section: r.section.name,
          subject: r.subject.name,
          subjectCode: r.subject.code,
        }));
    }

    return {
      teacher: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        designation: teacher.designation,
      },
      viewMode: day ? `SINGLE_DAY (${day})` : 'FULL_WEEK',
      totalClasses: routines.length,
      weeklySchedule,
    };
  }

  /**
   * Update an existing routine slot with conflict checks (excluding current slot)
   */
  async updateRoutine(id: string, updateRoutineDto: UpdateRoutineDto) {
    const existing = await this.getRoutineById(id);

    const {
      day,
      startTime,
      endTime,
      roomNumber,
      classId,
      sectionId,
      subjectId,
      teacherId,
    } = updateRoutineDto;

    const targetDay = day ?? existing.day;
    const targetStartTime = startTime ?? existing.startTime;
    const targetEndTime = endTime ?? existing.endTime;
    const targetRoomNumber =
      roomNumber !== undefined ? (roomNumber ? roomNumber.trim() : null) : existing.roomNumber;
    const targetClassId = classId ?? existing.classId;
    const targetSectionId = sectionId ?? existing.sectionId;
    const targetSubjectId = subjectId ?? existing.subjectId;
    const targetTeacherId = teacherId ?? existing.teacherId;

    // 1. Time Order Check
    const startMinutes = this.timeToMinutes(targetStartTime);
    const endMinutes = this.timeToMinutes(targetEndTime);
    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        `Start time (${targetStartTime}) must be earlier than end time (${targetEndTime})`,
      );
    }

    // 2. Validate entities if changed
    const [schoolClass, section, subject, teacher] = await Promise.all([
      prisma.schoolClass.findUnique({ where: { id: targetClassId } }),
      prisma.section.findUnique({ where: { id: targetSectionId } }),
      prisma.subject.findUnique({ where: { id: targetSubjectId } }),
      prisma.teacher.findUnique({ where: { id: targetTeacherId } }),
    ]);

    if (!schoolClass) {
      throw new NotFoundException(`Class with ID "${targetClassId}" not found`);
    }
    if (!section) {
      throw new NotFoundException(`Section with ID "${targetSectionId}" not found`);
    }
    if (!subject) {
      throw new NotFoundException(`Subject with ID "${targetSubjectId}" not found`);
    }
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${targetTeacherId}" not found`);
    }

    // 3. Consistency check: Section & Subject belong to Class
    if (section.classId !== targetClassId) {
      throw new BadRequestException(
        `Section "${section.name}" does not belong to class "${schoolClass.name}"`,
      );
    }
    const targetClassSubject = await prisma.classSubject.findFirst({
      where: { classId: targetClassId, subjectId: targetSubjectId },
    });
    if (!targetClassSubject) {
      throw new BadRequestException(
        `Subject "${subject.name}" is not assigned to class "${schoolClass.name}"`,
      );
    }

    // 4. Section Conflict Check (excluding current routine ID)
    const sectionConflict = await prisma.classRoutine.findFirst({
      where: {
        id: { not: id },
        day: targetDay,
        sectionId: targetSectionId,
        startTime: { lt: targetEndTime },
        endTime: { gt: targetStartTime },
      },
      include: {
        subject: true,
        teacher: true,
      },
    });

    if (sectionConflict) {
      throw new ConflictException(
        `Section "${section.name}" in "${schoolClass.name}" already has "${sectionConflict.subject.name}" class on ${targetDay} from ${sectionConflict.startTime} to ${sectionConflict.endTime} (Teacher: ${sectionConflict.teacher.name})`,
      );
    }

    // 5. Teacher Conflict Check (excluding current routine ID)
    const teacherConflict = await prisma.classRoutine.findFirst({
      where: {
        id: { not: id },
        day: targetDay,
        teacherId: targetTeacherId,
        startTime: { lt: targetEndTime },
        endTime: { gt: targetStartTime },
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
    });

    if (teacherConflict) {
      throw new ConflictException(
        `Teacher "${teacher.name}" is already assigned to "${teacherConflict.class.name} (${teacherConflict.section.name}) - ${teacherConflict.subject.name}" on ${targetDay} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`,
      );
    }

    // 6. Room Conflict Check (excluding current routine ID)
    if (targetRoomNumber && targetRoomNumber.trim()) {
      const roomConflict = await prisma.classRoutine.findFirst({
        where: {
          id: { not: id },
          day: targetDay,
          roomNumber: { equals: targetRoomNumber.trim(), mode: 'insensitive' },
          startTime: { lt: targetEndTime },
          endTime: { gt: targetStartTime },
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
          `Room "${targetRoomNumber.trim()}" is already booked for "${roomConflict.class.name} (${roomConflict.section.name}) - ${roomConflict.subject.name}" on ${targetDay} from ${roomConflict.startTime} to ${roomConflict.endTime} (Teacher: ${roomConflict.teacher.name})`,
        );
      }
    }

    // 7. Perform update
    return await prisma.classRoutine.update({
      where: { id },
      data: {
        day: targetDay,
        startTime: targetStartTime,
        endTime: targetEndTime,
        roomNumber: targetRoomNumber ? targetRoomNumber.trim() : null,
        classId: targetClassId,
        sectionId: targetSectionId,
        subjectId: targetSubjectId,
        teacherId: targetTeacherId,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
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

  /**
   * Delete a routine slot by ID
   */
  async deleteRoutine(id: string) {
    await this.getRoutineById(id);

    return await prisma.classRoutine.delete({
      where: { id },
    });
  }
}
