import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AcademicModule } from './academic/academic.module.js';
import { StudentsModule } from './students/students.module.js';
import { ParentsModule } from './parents/parents.module.js';
import { TeachersModule } from './teachers/teachers.module.js';
import { RoutinesModule } from './routines/routines.module.js';
import { ExamModule } from './exam/exam.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'school-central-backend',
    }),
    UsersModule,
    AuthModule,
    AcademicModule,
    StudentsModule,
    ParentsModule,
    TeachersModule,
    RoutinesModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

