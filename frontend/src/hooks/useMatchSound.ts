import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export const useMatchSound = (socket: Socket | null) => {
    // Dùng Ref để không bị re-render lại Audio object
    const sounds = useRef({
        ready: new Audio('/sounds/ready.mp3'),
        message: new Audio('/sounds/message.mp3'),
    });

    useEffect(() => {
        if (!socket) return;

        const play = (name: keyof typeof sounds.current) => {
            // Đặt lại thời gian về 0 để có thể phát lại ngay cả khi đang chạy
            sounds.current[name].currentTime = 0;
            sounds.current[name].play().catch(e => console.warn(`Error playing sound (${name}):`, e.message));
        };

        // 1. (Đã xóa) Có người vào/ra lobby (participants_update) -> Không phát tiếng
        
        // 2. Trạng thái Match thay đổi (veto_update)
        // Kích hoạt khi match chuyển trạng thái (PENDING -> VETO, VETO -> LIVE)
        const handleVetoUpdate = () => play('ready');

        // 3. Chat mới (new_chat_message)
        const handleNewChatMessage = () => play('message');

        socket.on('veto_update', handleVetoUpdate);
        socket.on('new_chat_message', handleNewChatMessage);

        return () => {
            socket.off('veto_update', handleVetoUpdate);
            socket.off('new_chat_message', handleNewChatMessage);
        };
    }, [socket]);
};