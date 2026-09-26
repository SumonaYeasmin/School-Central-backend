
import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';

@Global() // 👈 @Global দিলে অন্য কোনো মডিউলে বারবার ইমপোর্ট করতে হবে না!
@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
