
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StudentsService } from './students.service.js';
import { StudentsController } from './students.controller.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
