import { useState, useEffect } from 'react';
import { X, Check, Settings, ShieldAlert, Users, Info, Gamepad2 } from 'lucide-react';
import api from '../../services/api';
import type { Match, MapData } from '../../types/common';
import clsx from 'clsx';

interface ServerOption {
    id: number;
    display_name: string;
}

interface Props {
    match: Match;
    mapPool: MapData[];
    onClose: () => void;
}

export default function MatchSettingsModal({ match, mapPool, onClose }: Props) {
    const [isVetoEnabled, setIsVetoEnabled] = useState(match.is_veto_enabled === 1);
    const [isCaptainMode, setIsCaptainMode] = useState(match.is_captain_mode === 1);

    // Parse pre_selected_maps safely
    const initialMaps = Array.isArray(match.pre_selected_maps)
        ? match.pre_selected_maps
        : (match.map_result ? [match.map_result] : ['']);

    const [selectedMaps, setSelectedMaps] = useState<string[]>(initialMaps);

    // Info fields
    const [displayName, setDisplayName] = useState(match.display_name);
    const [team1Name, setTeam1Name] = useState(match.team1_name);
    const [team2Name, setTeam2Name] = useState(match.team2_name);
    const [seriesType, setSeriesType] = useState(match.series_type);
    const [serverId, setServerId] = useState(match.server_id);

    const [servers, setServers] = useState<ServerOption[]>([]);
    const [gameMode, setGameMode] = useState<'competitive' | 'wingman'>(match.game_mode || 'competitive');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/api/matches/servers').then(res => setServers(res.data)).catch(console.error);
    }, []);

    // Reset BO5 to BO3 when switching to wingman (wingman doesn't support BO5)
    useEffect(() => {
        if (gameMode === 'wingman' && seriesType === 'BO5') {
            setSeriesType('BO3');
        }
    }, [gameMode]);

    // Resize map array when series type changes
    useEffect(() => {
        const count = seriesType === 'BO1' ? 1 : (seriesType === 'BO3' ? 3 : 5);
        setSelectedMaps(prev => {
            const newMaps = [...prev];
            if (newMaps.length > count) return newMaps.slice(0, count);
            while (newMaps.length < count) newMaps.push('');
            return newMaps;
        });
    }, [seriesType]);

    const handleMapChange = (index: number, value: string) => {
        const newMaps = [...selectedMaps];
        newMaps[index] = value;
        setSelectedMaps(newMaps);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/api/matches/${match.id}/settings`, {
                is_veto_enabled: isVetoEnabled,
                is_captain_mode: isCaptainMode,
                game_mode: gameMode,
                pre_selected_maps: !isVetoEnabled ? selectedMaps : undefined,
                display_name: displayName,
                team1_name: team1Name,
                team2_name: team2Name,
                series_type: seriesType,
                server_id: serverId
            });
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || "Lỗi lưu cài đặt");
        } finally {
            setLoading(false);
        }
    };

    const mapCount = seriesType === 'BO1' ? 1 : (seriesType === 'BO3' ? 3 : 5);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700 shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-slate-400" /> Cài đặt Trận đấu
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* SECTION 1: BASIC INFO */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Info size={14} /> Thông tin cơ bản</h4>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Tên phòng</label>
                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                                value={displayName} onChange={e => setDisplayName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Team 1</label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                    value={team1Name} onChange={e => setTeam1Name(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Team 2</label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                    value={team2Name} onChange={e => setTeam2Name(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Thể thức</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                    value={seriesType} onChange={e => setSeriesType(e.target.value as any)}
                                >
                                    <option value="BO1">Best of 1</option>
                                    <option value="BO3">Best of 3</option>
                                    {gameMode !== 'wingman' && <option value="BO5">Best of 5</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Server</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                    value={serverId} onChange={e => setServerId(Number(e.target.value))}
                                >
                                    {servers.map(s => (
                                        <option key={s.id} value={s.id}>{s.display_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Game Mode */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Chế độ chơi</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGameMode('competitive')}
                                    className={clsx(
                                        "p-3 rounded border text-center transition-all",
                                        gameMode === 'competitive'
                                            ? "border-orange-500 bg-orange-900/30 text-orange-400"
                                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    <Gamepad2 size={20} className="mx-auto mb-1" />
                                    <span className="font-bold block">Competitive</span>
                                    <span className="text-[10px]">5 vs 5</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGameMode('wingman')}
                                    className={clsx(
                                        "p-3 rounded border text-center transition-all",
                                        gameMode === 'wingman'
                                            ? "border-blue-500 bg-blue-900/30 text-blue-400"
                                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    <Users size={20} className="mx-auto mb-1" />
                                    <span className="font-bold block">Wingman</span>
                                    <span className="text-[10px]">2 vs 2</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800"></div>

                    {/* SECTION 2: ADVANCED */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Settings size={14} /> Nâng cao</h4>

                        {/* Setting: Veto System */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between cursor-pointer group bg-slate-800/50 p-3 rounded border border-slate-700 hover:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded", isVetoEnabled ? "bg-green-900/50 text-green-400" : "bg-slate-800 text-slate-500")}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-200 block">Hệ thống Veto Map</span>
                                        <span className="text-xs text-slate-500">Ban/Pick map trước khi đá</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isVetoEnabled} onChange={e => setIsVetoEnabled(e.target.checked)} />
                                    <div className={clsx("w-10 h-5 rounded-full transition-colors", isVetoEnabled ? "bg-green-600" : "bg-slate-700")}></div>
                                    <div className={clsx("absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform", isVetoEnabled ? "translate-x-5" : "")}></div>
                                </div>
                            </label>

                            {!isVetoEnabled && (
                                <div className="ml-8 space-y-2 animate-in slide-in-from-top-2">
                                    <p className="text-[10px] text-yellow-500 uppercase font-bold">* Chọn {mapCount} Map thi đấu:</p>
                                    {selectedMaps.map((mapVal, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 w-12 font-mono">MAP {idx + 1}</span>
                                            <select
                                                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm"
                                                value={mapVal}
                                                onChange={e => handleMapChange(idx, e.target.value)}
                                            >
                                                <option value="">-- Chọn Map --</option>
                                                {mapPool.map(m => (
                                                    <option key={m.map_key} value={m.map_key} disabled={selectedMaps.includes(m.map_key) && mapVal !== m.map_key}>
                                                        {m.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Setting: Captain Mode */}
                        <div className="space-y-3">
                            <label className="flex items-center justify-between cursor-pointer group bg-slate-800/50 p-3 rounded border border-slate-700 hover:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded", isCaptainMode ? "bg-blue-900/50 text-blue-400" : "bg-slate-800 text-slate-500")}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-200 block">Chế độ Captain Pick</span>
                                        <span className="text-xs text-slate-500">Đội trưởng chọn thành viên</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isCaptainMode} onChange={e => setIsCaptainMode(e.target.checked)} />
                                    <div className={clsx("w-10 h-5 rounded-full transition-colors", isCaptainMode ? "bg-blue-600" : "bg-slate-700")}></div>
                                    <div className={clsx("absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform", isCaptainMode ? "translate-x-5" : "")}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 px-6 py-4 flex justify-end gap-3 border-t border-slate-700 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-medium">Hủy</button>
                    <button
                        onClick={handleSave}
                        disabled={loading || (!isVetoEnabled && selectedMaps.some(m => !m))}
                        className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold flex items-center gap-2"
                    >
                        {loading ? 'Đang lưu...' : <><Check size={18} /> Lưu Thay Đổi</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
