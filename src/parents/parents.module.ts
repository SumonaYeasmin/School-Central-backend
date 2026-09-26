import { Module } from '@nestjs/common';
import { ParentsService } from './parents.service.js';
import { ParentsController } from './parents.controller.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [MailModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
