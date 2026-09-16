import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller.js';
import { AcademicService } from './academic.service.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AcademicController],
  providers: [AcademicService]
})
export class AcademicModule {}
