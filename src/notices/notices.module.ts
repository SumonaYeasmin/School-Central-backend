import { Module } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { NoticesController } from './notices.controller.js';

@Module({
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
