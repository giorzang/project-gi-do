import { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Shield, Swords, Eye, Play, User as UserIcon, Gamepad2, Link as LinkIcon, Map as MapIcon, Copy, Terminal, Ban } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import clsx from 'clsx';
import VetoBoard from './VetoBoard';
import type { Participant, MatchContextType } from '../../types/common';

export default function MatchLobby() {
    const { match, participants, mapPool, isAdmin, isLocked, handleJoin, handleStartMatch } = useOutletContext<MatchContextType>();
    const { user } = useAuthStore();

    // Phân loại người chơi
    const team1Players = useMemo(() => participants.filter(p => p.team === 'TEAM1'), [participants]);
    const team2Players = useMemo(() => participants.filter(p => p.team === 'TEAM2'), [participants]);
    const spectators = useMemo(() => participants.filter(p => p.team === 'SPECTATOR'), [participants]);
    const mySlot = useMemo(() => participants.find(p => p.user_id === user?.id), [participants, user]);

    // Helper: Tính toán danh sách Map thi đấu
    const getPlayedMaps = () => {
        if (!match) return [];
        
        // Ensure veto_log is an array
        const vetoLog = Array.isArray(match.veto_log) ? match.veto_log : [];

        if (match.series_type === 'BO1') {
            return match.map_result ? [match.map_result] : [];
        }
        const picks = vetoLog.filter(l => l.action === 'PICK').map(l => l.map);
        if (match.map_result) picks.push(match.map_result);
        return picks;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Đã copy: " + text);
    };

    const handleCancelMatch = async () => {
        if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn HỦY trận đấu này ngay lập tức?\nLệnh 'css_forceend' sẽ được gửi tới server và trạng thái trận đấu sẽ chuyển thành CANCELLED.")) return;
        try {
            await api.post(`/api/matches/${match.id}/cancel`);
            alert("Đã hủy trận đấu thành công!");
            // Force reload or navigation could happen here, but socket should update status
        } catch (error: any) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    const PlayerSlot = ({ player, emptyText, onJoin }: { player?: Participant, emptyText?: string, onJoin?: () => void }) => {
        if (player) {
            return (
                <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded border border-slate-700 animate-in fade-in zoom-in duration-200">
                    <img src={player.avatar_url} className="w-8 h-8 rounded" alt="avatar" />
                    <span className={clsx("font-bold truncate", player.user_id === user?.id ? "text-orange-400" : "text-slate-200")}>
                        {player.username}
                    </span>
                </div>
            );
        }
        return (
            <button
                onClick={onJoin}
                disabled={isLocked}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 border border-dashed p-3 rounded transition-all",
                    isLocked
                        ? "border-slate-800 text-slate-700 cursor-not-allowed"
                        : "border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800"
                )}
            >
                <UserIcon size={16} /> {isLocked ? "Đã khóa" : (emptyText || "Trống")}
            </button>
        );
    };

    const renderMainContent = () => {
        // 1. PENDING
        if (match.status === 'PENDING') {
            return (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center mb-8 backdrop-blur-sm">
                    <Shield size={48} className="mx-auto text-slate-600 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Sảnh Chờ</h2>
                    <p className="text-slate-400 mb-6">Đợi người chơi vào đủ các slot...</p>

                    {isAdmin && (
                        <button
                            onClick={handleStartMatch}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded font-bold text-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            <Play size={20} /> Bắt đầu Trận Đấu
                        </button>
                    )}
                    {!isAdmin && <p className="text-sm text-yellow-500 animate-pulse">Chờ chủ phòng bắt đầu...</p>}
                </div>
            );
        }

        // 2. VETO
        if (match.status === 'VETO') {
            return (
                <div className="mb-8">
                    <VetoBoard match={match} mySlot={mySlot} />
                </div>
            );
        }

        // 3. LIVE / FINISHED (Hiển thị Map List để bấm vào xem Stats)
        if (match.status === 'LIVE' || match.status === 'FINISHED') {
            const playedMaps = getPlayedMaps();
            const connectCmd = `connect ${match.ip}:${match.port}`;

            return (
                <div className="mb-8 space-y-6">
                     {match.status === 'LIVE' && (
                        <div className="bg-slate-900 border border-green-500/30 rounded-xl p-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10"><Gamepad2 size={120}/></div>
                             <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                 <div>
                                     <div className="flex items-center gap-3 mb-2">
                                         <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
                                         <h2 className="text-2xl font-bold text-white">Server Info</h2>
                                     </div>
                                     <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-slate-700 mt-2">
                                         <Terminal size={16} className="text-slate-500"/>
                                         <code className="text-green-400 font-mono text-sm">{connectCmd}</code>
                                         <button onClick={() => copyToClipboard(connectCmd)} className="text-slate-400 hover:text-white" title="Copy"><Copy size={16}/></button>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                     {isAdmin && (
                                        <button 
                                            onClick={handleCancelMatch}
                                            className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-3 rounded font-bold shadow-lg flex items-center gap-2 border border-red-700"
                                            title="Gửi lệnh hủy trận đấu (css_forceend)"
                                        >
                                            <Ban size={18}/> HỦY TRẬN
                                        </button>
                                     )}
                                     <a href={`steam://connect/${match.ip}:${match.port}`} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold shadow-lg flex items-center gap-2">
                                         <LinkIcon size={18}/> CONNECT
                                     </a>
                                 </div>
                             </div>
                        </div>
                     )}

                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><MapIcon/> Danh sách Map thi đấu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {playedMaps.map((mapKey, idx) => {
                            const mapInfo = mapPool.find(m => m.map_key === mapKey);
                            const mapIndex = idx + 1; // 1-based index for URL
                            
                            return (
                                <Link to={`${mapIndex}`} key={mapKey} className="group relative h-32 rounded-lg overflow-hidden border border-slate-700 hover:border-orange-500 transition-all block">
                                    {mapInfo?.image_url && <img src={mapInfo.image_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>}
                                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center">
                                        <span className="text-slate-300 font-bold text-sm tracking-widest mb-1">MAP {mapIndex}</span>
                                        <span className="text-2xl font-black text-white uppercase">{mapInfo?.display_name || mapKey}</span>
                                        <span className="mt-2 bg-orange-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Xem Stats</span>
                                    </div>
                                </Link>
                            );
                        })}
                         {playedMaps.length === 0 && <p className="text-slate-500 italic col-span-3">Chưa có map nào được chọn.</p>}
                    </div>
                </div>
            );
        }
    };

    return (
        <div>
            {renderMainContent()}

            {/* Team Selection UI (Luôn hiện để xem ai team nào) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TEAM 1 */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-900/40 to-slate-900 border-l-4 border-orange-500 p-4 rounded-r">
                        <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2">
                            <Swords size={20} /> {match.team1_name}
                        </h2>
                        <p className="text-xs text-slate-500">{team1Players.length}/5</p>
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <PlayerSlot key={i} player={team1Players[i]} emptyText="Vào Team 1" onJoin={() => handleJoin('TEAM1')} />
                        ))}
                    </div>
                </div>

                {/* SPECTATORS */}
                <div className="flex flex-col gap-6">
                    <div className="text-center py-4">
                        <span className="text-5xl font-black text-slate-800 select-none font-mono">VS</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex-1">
                        <h3 className="text-slate-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase">
                            <Eye size={16} /> Khán giả ({spectators.length})
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {spectators.map(p => (
                                <div key={p.user_id} className="flex items-center gap-2 text-sm text-slate-400 hover:bg-slate-800 p-1.5 rounded">
                                    <img src={p.avatar_url} className="w-5 h-5 rounded-full" />
                                    <span>{p.username}</span>
                                </div>
                            ))}
                            <button
                                onClick={() => handleJoin('SPECTATOR')}
                                disabled={mySlot?.team === 'SPECTATOR' || isLocked}
                                className="w-full text-xs text-slate-500 hover:text-white border border-dashed border-slate-800 hover:border-slate-600 p-2 rounded mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLocked ? "Đã khóa đội hình" : "Chuyển sang Khán giả"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* TEAM 2 */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-l from-blue-900/40 to-slate-900 border-r-4 border-blue-500 p-4 rounded-l text-right">
                        <h2 className="text-xl font-bold text-blue-500 flex items-center gap-2 justify-end">
                            {match.team2_name} <Shield size={20} />
                        </h2>
                        <p className="text-xs text-slate-500">{team2Players.length}/5</p>
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <PlayerSlot key={i} player={team2Players[i]} emptyText="Vào Team 2" onJoin={() => handleJoin('TEAM2')} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
