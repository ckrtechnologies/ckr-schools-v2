import { Server } from 'socket.io';
import { pgPool } from '../config/db.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Identify user & tenant
    socket.on('identify', async (payload) => {
      // payload can be userId string (legacy) or object { userId, tenantId, tenantSlug }
      const userId = typeof payload === 'object' ? payload.userId : payload;
      let tenantId = typeof payload === 'object' ? payload.tenantId : null;

      if (!userId) return;
      socket.userId = userId;

      let userName = 'Unknown';
      let userType = 'student';
      let linkedIds = [];

      try {
        const uRes = await pgPool.query(
          `SELECT id, tenant_id, name, type FROM public."user" WHERE id = $1`,
          [userId]
        );
        if (uRes.rows.length > 0) {
          userName = uRes.rows[0].name || 'User';
          userType = uRes.rows[0].type || 'student';
          tenantId = tenantId || uRes.rows[0].tenant_id;

          if (userType === 'student') {
            const spRes = await pgPool.query(
              `SELECT parent_id FROM public.student_parents WHERE student_id = $1 AND tenant_id = $2`,
              [userId, tenantId]
            );
            linkedIds = spRes.rows.map(r => r.parent_id);
          }
        } else {
          // Check parents table
          const pRes = await pgPool.query(
            `SELECT id, tenant_id, father_name, mother_name FROM public.parents WHERE id = $1`,
            [userId]
          );
          if (pRes.rows.length > 0) {
            userName = pRes.rows[0].father_name || pRes.rows[0].mother_name || 'Parent';
            userType = 'parent';
            tenantId = tenantId || pRes.rows[0].tenant_id;

            const spRes = await pgPool.query(
              `SELECT student_id FROM public.student_parents WHERE parent_id = $1 AND tenant_id = $2`,
              [userId, tenantId]
            );
            linkedIds = spRes.rows.map(r => r.student_id);
          }
        }
      } catch (err) {
        console.error('Socket identity lookup error:', err.message);
      }

      socket.tenantId = tenantId;
      socket.userName = userName;
      socket.userType = userType;
      socket.linkedIds = linkedIds;

      // Multi-tenant room isolation
      socket.join(userId);
      for (const linkedId of linkedIds) {
        socket.join(linkedId);
      }

      if (tenantId) {
        socket.join(`tenant:${tenantId}`);
        socket.join(`tenant:${tenantId}:user:${userId}`);
        for (const linkedId of linkedIds) {
          socket.join(`tenant:${tenantId}:user:${linkedId}`);
        }

        if (['admin', 'principal', 'super_admin'].includes(userType)) {
          socket.join(`tenant:${tenantId}:admin_monitor`);
          socket.join('admin_monitor'); // Legacy compatibility
        }
      }
    });

    // Join 1-to-1 chat room
    socket.on('join_chat', async ({ senderId, receiverId, tenantId }) => {
      let activeTenant = tenantId || socket.tenantId;
      if (!activeTenant && senderId && receiverId) {
        try {
          const tRes = await pgPool.query(
            `SELECT tenant_id FROM public."user" WHERE id IN ($1, $2)
             UNION
             SELECT tenant_id FROM public.parents WHERE id IN ($1, $2)
             LIMIT 1`,
            [senderId, receiverId]
          );
          if (tRes.rows.length > 0) activeTenant = tRes.rows[0].tenant_id;
        } catch (e) {}
      }
      activeTenant = activeTenant || 'common';
      const sortedPair = [senderId, receiverId].sort().join('_');
      
      socket.join(`tenant:${activeTenant}:chat:${sortedPair}`);
      socket.join(`chat:${sortedPair}`);
      socket.join(sortedPair); // Legacy compatibility
    });

    // Send chat message
    socket.on('send_message', async (messageData) => {
      const { sender_id, receiver_id, message, type } = messageData;
      let tenantId = messageData.tenant_id || socket.tenantId;

      if (!sender_id || !receiver_id) return;

      if (!tenantId) {
        try {
          const tRes = await pgPool.query(
            `SELECT tenant_id FROM public."user" WHERE id IN ($1, $2)
             UNION
             SELECT tenant_id FROM public.parents WHERE id IN ($1, $2)
             LIMIT 1`,
            [sender_id, receiver_id]
          );
          if (tRes.rows.length > 0) tenantId = tRes.rows[0].tenant_id;
        } catch (e) {}
      }

      if (!tenantId) return;

      const sortedPair = [sender_id, receiver_id].sort().join('_');
      const tenantRoom = `tenant:${tenantId}:chat:${sortedPair}`;

      try {
        // 1. Insert chat into communication table
        const insertRes = await pgPool.query(
          `INSERT INTO public.communication (tenant_id, sender_id, receiver_id, message, type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [tenantId, sender_id, receiver_id, message || '', type || 'live_chat']
        );
        const chat = insertRes.rows[0];

        // 2. Emit to real-time recipients
        io.to(tenantRoom)
          .to(`chat:${sortedPair}`)
          .to(sortedPair) // Legacy
          .to(`tenant:${tenantId}:user:${sender_id}`)
          .to(`tenant:${tenantId}:user:${receiver_id}`)
          .to(`tenant:${tenantId}:admin_monitor`)
          .to(sender_id)   // Legacy
          .to(receiver_id) // Legacy
          .to('admin_monitor') // Legacy
          .emit('receive_message', chat);

        // 3. Insert notification for receiver if receiver is in public."user"
        try {
          const userCheck = await pgPool.query(
            `SELECT id FROM public."user" WHERE id = $1`,
            [receiver_id]
          );
          if (userCheck.rows.length > 0) {
            await pgPool.query(
              `INSERT INTO public.notifications (tenant_id, user_id, title, message, type, is_read)
               VALUES ($1, $2, $3, $4, $5, FALSE)`,
              [
                tenantId,
                receiver_id,
                'New Message',
                message || `You received a new ${type || 'message'}`,
                type || 'live_chat'
              ]
            );
          }
        } catch (notifErr) {
          console.error('Socket notification error (non-fatal):', notifErr.message);
        }
      } catch (err) {
        console.error('Socket send_message error:', err.message);
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ senderId, receiverId, tenantId }) => {
      const activeTenant = tenantId || socket.tenantId || 'common';
      const sortedPair = [senderId, receiverId].sort().join('_');
      io.to(`tenant:${activeTenant}:chat:${sortedPair}`)
        .to(`chat:${sortedPair}`)
        .to(sortedPair)
        .to(receiverId)
        .emit('typing_start', { senderId });
    });

    socket.on('typing_stop', ({ senderId, receiverId, tenantId }) => {
      const activeTenant = tenantId || socket.tenantId || 'common';
      const sortedPair = [senderId, receiverId].sort().join('_');
      io.to(`tenant:${activeTenant}:chat:${sortedPair}`)
        .to(`chat:${sortedPair}`)
        .to(sortedPair)
        .to(receiverId)
        .emit('typing_stop', { senderId });
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
};

/**
 * Broadcast event across an entire tenant school
 */
export const broadcastToTenant = (tenantId, event, data) => {
  if (io && tenantId) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
};

