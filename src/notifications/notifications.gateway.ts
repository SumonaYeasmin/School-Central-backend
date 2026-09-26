
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { userId, role } = client.handshake.query as { userId?: string; role?: string };
    
    // ১. গ্লোবাল রুমে জয়েন
    client.join('room:all');

    // ২. রোল রুমে জয়েন (TEACHER / PARENT)
    if (role) {
      client.join(`role:${role.toUpperCase()}`);
    }

    // ৩. নির্দিষ্ট ইউজারের প্রাইভেট রুম (১-অন-১ নোটিফিকেশনের জন্য)
    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // ডিসকানেক্ট হ্যান্ডেল
  }

  // ক. নির্দিষ্ট ১ জন ইউজারকে নোটিফিকেশন পাঠানো (যেমন: টিচার অ্যাসাইনমেন্ট)
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // খ. নির্দিষ্ট রোলের সবাইকে পাঠানো (যেমন: সব টিচারদের নোটিশ)
  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role.toUpperCase()}`).emit(event, data);
  }

  // গ. সবাইকে পাঠানো (যেমন: গ্লোবাল নোটিশ)
  sendToAll(event: string, data: any) {
    this.server.to('room:all').emit(event, data);
  }
}
