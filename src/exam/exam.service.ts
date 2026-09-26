import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../shared/prisma.js';
import { InMemoryCache } from '../shared/cache.service.js';
import { CreateExamDto } from './dto/creat-exam.dto.js';
import { ResultStatus } from '../generated/prisma/enums.js';

@Injectable()
export class ExamService {
  /**
   * 1. Create a new Exam
   */
  async createExam(createExamDto: CreateExamDto) {
    const { name, year, status } = createExamDto;

    // Check if exam with the same name and year already exists
    const existingExam = await prisma.exam.findUnique({
      where: {
        name_year: {
          name: name.trim(),
          year,
        },
      },
    });

    if (existingExam) {
      throw new ConflictException(
        `Exam "${name.trim()}" for year ${year} already exists`,
      );
    }

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        year,
        status: status || ResultStatus.DRAFT,
        resultPublishedAt: status === ResultStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    InMemoryCache.invalidate('exams:*');

    return {
      message: 'Exam created successfully',
      exam,
    };
  }

  /**
   * 2. Get all Exams (with total results count)
   */
  async getAllExams() {
    const cacheKey = 'exams:all';
    const cached = InMemoryCache.get(cacheKey);
    if (cached) return cached;

    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { results: true },
        },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });

    InMemoryCache.set(cacheKey, exams, 300); // 5 mins
    return exams;
  }

  /**
   * 3. Get single Exam by ID
   */
  async getExamById(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID "${id}" not found`);
    }

    return exam;
  }

  /**
   * 4. Publish exam results
   * Sets status to PUBLISHED and updates resultPublishedAt to current time
   */
  async publishExamResult(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID "${id}" not found`);
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        status: ResultStatus.PUBLISHED,
        resultPublishedAt: new Date(),
      },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    return {
      message: `Result for "${exam.name}" has been published successfully`,
      totalResults: updatedExam._count.results,
      exam: updatedExam,
    };
  }

  /**
   * 5. Unpublish exam results
   * Reverts status to DRAFT and resets resultPublishedAt
   */
  async unpublishExamResult(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID "${id}" not found`);
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        status: ResultStatus.DRAFT,
        resultPublishedAt: null,
      },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    return {
      message: `Result for "${exam.name}" has been reverted to DRAFT`,
      exam: updatedExam,
    };
  }
}
