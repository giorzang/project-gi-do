const socketIo = require('socket.io');

let io;

exports.init = (server) => {
    io = socketIo(server, {
        cors: {
            // Cho phép mọi nguồn kết nối (để chạy LAN/Public IP)
            origin: true, 
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        socket.on('join_match_room', (matchId) => {
            if (!matchId) return;
            const roomName = `match_${matchId}`;
            socket.join(roomName);
            console.log(`User ${socket.id} ---> Joined Room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
};

exports.getIo = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};