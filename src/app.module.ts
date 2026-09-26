import { Module } from '@nestjs/common';
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
import { ResultModule } from './result/result.module.js';
import { MailModule } from './mail/mail.module.js';
import { NoticesModule } from './notices/notices.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    MailModule,
    UsersModule,
    AuthModule,
    AcademicModule,
    StudentsModule,
    ParentsModule,
    TeachersModule,
    RoutinesModule,
    ExamModule,
    ResultModule,
    NoticesModule,
    NotificationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

