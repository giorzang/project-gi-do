import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { ChevronLeft, RefreshCcw } from 'lucide-react';
import type { MatchContextType } from '../../types/common';
import api from '../../services/api';
import clsx from 'clsx';

// Cập nhật Interface theo dữ liệu từ MatchZy
interface PlayerStats {
    steamid?: string;
    steamid64?: string;
    name: string;
    team: string;
    kills: number;
    deaths: number;
    assists: number;
    head_shot_kills: number; // DB dùng headshot_kills nhưng socket có thể khác, ta map linh hoạt
    headshot_kills?: number; // Fallback
    damage: number;
    utility_damage: number;
    
    // Các chỉ số Multi-kill & MVP
    mvp?: number;
    enemy5ks?: number; 
    enemy4ks?: number; 
    enemy3ks?: number; 
    enemy2ks?: number; 
    
    // Fallback mapping (một số version matchzy dùng tên khác)
    v5?: number; // Đôi khi là clutch, đôi khi là kills
}

export default function MatchMapStats() {
    const { mapnumber } = useParams();
    const { match, socket, mapPool } = useOutletContext<MatchContextType>();
    
    const [scoreTeam1, setScoreTeam1] = useState(0);
    const [scoreTeam2, setScoreTeam2] = useState(0);
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [mapStatus, setMapStatus] = useState<string>('PENDING'); // New State
    const [loading, setLoading] = useState(true);
    
    const totalRounds = Number(scoreTeam1) + Number(scoreTeam2);
    const mapIndex = parseInt(mapnumber || '1') - 1;
    
    // Helper để lấy map key
    const getMapKey = () => {
        if (!match.veto_log) return null;
        const vetoLog = Array.isArray(match.veto_log) ? match.veto_log : [];
        
        if (match.series_type === 'BO1') {
            return match.map_result || (vetoLog.length > 0 ? vetoLog[0].map : null);
        }
        const picks = vetoLog.filter(l => l.action === 'PICK').map(l => l.map);
        if (match.map_result) picks.push(match.map_result);
        return picks[mapIndex];
    };
    
    const currentMapKey = getMapKey();
    const mapInfo = mapPool.find(m => m.map_key === currentMapKey);

    // 1. Fetch Initial Data
    useEffect(() => {
        if (!match.id) return;
        setLoading(true);
        api.get(`/api/matches/${match.id}/stats`)
            .then(res => {
                const data = res.data;
                if (data.maps && data.maps[mapIndex]) {
                    const currentMapData = data.maps[mapIndex];
                    setScoreTeam1(currentMapData.score_team1 || 0);
                    setScoreTeam2(currentMapData.score_team2 || 0);
                    setStats(currentMapData.player_stats || []);
                    if (currentMapData.status) setMapStatus(currentMapData.status); // Set Map Status
                }
            })
            .catch(err => console.error("Failed to fetch stats:", err))
            .finally(() => setLoading(false));

    }, [match.id, mapIndex]);

    // 2. Listen for Real-time Events
    useEffect(() => {
        if (!socket) return;

        const handleRoundEnd = (data: any) => {
            if (String(data.matchId) === String(match.id) && String(data.map_name) === String(mapnumber)) {
                setScoreTeam1(data.team1_score);
                setScoreTeam2(data.team2_score);
            }
        };

        const handleLiveStats = (data: any) => {
             if (String(data.matchId) === String(match.id) && String(data.map_name) === String(mapnumber)) {
                 setStats(data.player_stats);
             }
        };

        const handleMapEnd = (data: any) => {
             if (String(data.matchId) === String(match.id) && String(data.map_name) === String(mapnumber)) {
                 setMapStatus('FINISHED');
             }
        };
        
        const handleMatchStarted = (data: any) => {
            if (String(data.matchId) === String(match.id)) {
                setScoreTeam1(0);
                setScoreTeam2(0);
                setStats([]);
                // Reload status could be handled here or by re-fetching
            }
        };

        socket.on('round_end', handleRoundEnd);
        socket.on('live_stats', handleLiveStats);
        socket.on('map_end', handleMapEnd);
        socket.on('match_started', handleMatchStarted);

        return () => {
            socket.off('round_end', handleRoundEnd);
            socket.off('live_stats', handleLiveStats);
            socket.off('map_end', handleMapEnd);
            socket.off('match_started', handleMatchStarted);
        };
    }, [socket, match.id, mapnumber]);

    // --- Helpers tính toán ---
    const calculateHSP = (kills: number, hs: number) => {
        if (kills === 0) return 0;
        return Math.round((hs / kills) * 100);
    };

    const calculateADR = (damage: number) => {
        if (totalRounds === 0) return 0;
        return Math.round(damage / totalRounds);
    };

    const calculateKD = (kills: number, deaths: number) => {
        if (deaths === 0) return kills.toFixed(2); 
        return (kills / deaths).toFixed(2);
    };

    const calculateKR = (kills: number) => {
        if (totalRounds === 0) return "0.00";
        return (kills / totalRounds).toFixed(2);
    };

    // Component bảng điểm
    const ScoreboardTable = ({ teamName, players, colorClass }: { teamName: string, players: PlayerStats[], colorClass: string }) => (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-6">
            <div className={`px-4 py-3 font-bold text-lg ${colorClass} bg-slate-800/50 flex justify-between`}>
                <span>{teamName}</span>
                <span>Score: {teamName === match.team1_name ? scoreTeam1 : scoreTeam2}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400 min-w-[800px]">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-800/30 text-center font-bold">
                        <tr>
                            <th className="px-4 py-3 text-left min-w-[150px]">Player</th>
                            <th className="px-2 py-3 w-12 text-white" title="Kills">K</th>
                            <th className="px-2 py-3 w-12 text-red-400" title="Deaths">D</th>
                            <th className="px-2 py-3 w-12" title="Assists">A</th>
                            <th className="px-2 py-3 w-16 text-orange-400" title="Average Damage per Round">ADR</th>
                            <th className="px-2 py-3 w-16" title="Kill / Death Ratio">K/D</th>
                            <th className="px-2 py-3 w-16" title="Kills per Round">K/R</th>
                            <th className="px-2 py-3 w-16" title="Headshot Percentage">HS%</th>
                            <th className="px-1 py-3 w-10 text-slate-600" title="5 Kills (Ace)">5k</th>
                            <th className="px-1 py-3 w-10 text-slate-600" title="4 Kills">4k</th>
                            <th className="px-1 py-3 w-10 text-slate-600" title="3 Kills">3k</th>
                            <th className="px-1 py-3 w-10 text-slate-600" title="2 Kills">2k</th>
                            <th className="px-2 py-3 w-12 text-yellow-500" title="MVPs">MVP</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {players.map((p, idx) => {
                            const hsKills = p.head_shot_kills || p.headshot_kills || 0;
                            const mk5 = p.enemy5ks || 0;
                            const mk4 = p.enemy4ks || 0;
                            const mk3 = p.enemy3ks || 0;
                            const mk2 = p.enemy2ks || 0;
                            
                            return (
                                <tr key={p.steamid64 || p.steamid || idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-white text-left truncate max-w-[180px]">
                                        {p.name}
                                    </td>
                                    <td className="px-2 py-2.5 font-bold text-white">{p.kills}</td>
                                    <td className="px-2 py-2.5 text-red-400">{p.deaths}</td>
                                    <td className="px-2 py-2.5">{p.assists}</td>
                                    <td className="px-2 py-2.5 text-orange-400 font-medium">{calculateADR(p.damage)}</td>
                                    <td className={`px-2 py-2.5 font-bold ${parseFloat(calculateKD(p.kills, p.deaths)) >= 1 ? 'text-green-400' : 'text-slate-500'}`}>
                                        {calculateKD(p.kills, p.deaths)}
                                    </td>
                                    <td className="px-2 py-2.5">{calculateKR(p.kills)}</td>
                                    <td className="px-2 py-2.5 text-slate-300">{calculateHSP(p.kills, hsKills)}%</td>
                                    
                                    {/* Multi-kills */}
                                    <td className={`px-1 py-2.5 font-bold ${mk5 > 0 ? 'text-purple-500' : 'text-slate-700'}`}>{mk5 > 0 ? mk5 : '-'}</td>
                                    <td className={`px-1 py-2.5 font-bold ${mk4 > 0 ? 'text-blue-500' : 'text-slate-700'}`}>{mk4 > 0 ? mk4 : '-'}</td>
                                    <td className={`px-1 py-2.5 font-bold ${mk3 > 0 ? 'text-green-500' : 'text-slate-700'}`}>{mk3 > 0 ? mk3 : '-'}</td>
                                    <td className={`px-1 py-2.5 ${mk2 > 0 ? 'text-slate-300' : 'text-slate-700'}`}>{mk2 > 0 ? mk2 : '-'}</td>
                                    
                                    {/* MVP */}
                                    <td className={`px-2 py-2.5 font-bold ${p.mvp && p.mvp > 0 ? 'text-yellow-500' : 'text-slate-700'}`}>
                                        {p.mvp && p.mvp > 0 ? `★ ${p.mvp}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {players.length === 0 && (
                            <tr><td colSpan={13} className="text-center py-8 italic text-slate-500">
                                {loading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu thống kê."}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (!currentMapKey) {
        return (
            <div className="text-center mt-10">
                <p className="text-slate-500 mb-4">Map này chưa được chọn hoặc không tồn tại trong danh sách thi đấu.</p>
                <Link to=".." className="text-orange-500 hover:underline">Quay lại Lobby</Link>
            </div>
        );
    }

    // Logic filter thông minh (giữ nguyên như cũ)
    let t1Players = stats.filter(s => s.team === match.team1_name || s.team === 'TEAM1' || s.team === 'CT' || s.team === 'TERRORIST');
    let t2Players = stats.filter(s => s.team === match.team2_name || s.team === 'TEAM2');

    // Fallback đơn giản
    if (t1Players.length === 0 && t2Players.length === 0 && stats.length > 0) {
        const mid = Math.ceil(stats.length / 2);
        t1Players = stats.slice(0, mid);
        t2Players = stats.slice(mid);
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
                <Link to=".." className="p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        MAP {mapnumber}: <span className="text-orange-500 uppercase">{mapInfo?.display_name || currentMapKey}</span>
                        <span className={clsx("text-xs px-2 py-0.5 rounded font-bold uppercase border", 
                            mapStatus === 'LIVE' ? "bg-red-500/20 text-red-500 border-red-500/50" : 
                            mapStatus === 'FINISHED' ? "bg-blue-500/20 text-blue-500 border-blue-500/50" : 
                            "bg-slate-700/50 text-slate-400 border-slate-600"
                        )}>
                          {mapStatus}
                        </span>
                    </h2>
                    <p className="text-sm text-slate-500">
                        {mapStatus === 'LIVE' ? 'Đang thi đấu - Cập nhật Realtime' : 
                         mapStatus === 'FINISHED' ? 'Đã kết thúc' : 'Chưa diễn ra'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ScoreboardTable 
                    teamName={match.team1_name} 
                    players={t1Players}
                    colorClass="text-orange-500"
                />
                <ScoreboardTable 
                    teamName={match.team2_name} 
                    players={t2Players}
                    colorClass="text-blue-500"
                />
            </div>
            
            {mapStatus === 'LIVE' && (
                <div className="flex justify-center mt-8">
                    <span className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-500 rounded-full text-sm font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <RefreshCcw size={14} className="animate-spin"/> LIVE TRACKING FROM MATCHZY
                    </span>
                </div>
            )}
        </div>
    );
}