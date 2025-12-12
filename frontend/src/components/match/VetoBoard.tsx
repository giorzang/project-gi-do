import { useEffect, useState, useMemo } from 'react';
import { Shield, Swords, Ban, CheckCircle2 } from 'lucide-react';
import api from "../../services/api";
import type { Match, MapData, VetoLog, Participant } from '../../types/common';
import clsx from 'clsx';

interface Props {
  match: Match;
  mySlot?: Participant; // Thông tin slot của người đang xem (để biết họ thuộc team nào)
}

// Logic tính lượt (Copy logic từ Backend sang để UI đồng bộ tức thì)
const calculateState = (vetoLog: VetoLog[], seriesType: string) => {
    const mapActions = vetoLog.filter((l: VetoLog) => l.action === 'BAN' || l.action === 'PICK');
    const lastAction = vetoLog[vetoLog.length - 1];

    // Check Side Pick
    if (lastAction && lastAction.action === 'PICK') {
        const nextTeam = lastAction.team === 'TEAM1' ? 'TEAM2' : 'TEAM1';
        return { turn: nextTeam, type: 'SIDE_PICK', mapRef: lastAction.map };
    }

    const turnIndex = mapActions.length;
    let turnTeam = 'TEAM1';
    let type = 'BAN';

    if (seriesType === 'BO1') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        turnTeam = turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2';
        type = 'BAN';
    } else if (seriesType === 'BO3') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        turnTeam = turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2';
        if (turnIndex < 2) type = 'BAN';
        else if (turnIndex < 4) type = 'PICK';
        else type = 'BAN';
    } else if (seriesType === 'BO5') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        turnTeam = turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2';
        if (turnIndex < 2) type = 'BAN';
        else type = 'PICK';
    }

    return { turn: turnTeam, type, mapRef: null };
};

export default function VetoBoard({ match, mySlot }: Props) {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Load Map Pool từ DB
  useEffect(() => {
    api.get('/api/matches/maps/active').then(res => setMaps(res.data));
  }, []);

  // 2. Tính toán trạng thái hiện tại
  const currentState = useMemo(() => 
    calculateState(match.veto_log || [], match.series_type), 
  [match.veto_log, match.series_type]);

  // 3. Kiểm tra quyền hạn: Có phải lượt của tôi không?
  const isMyTurn = mySlot && mySlot.team === currentState.turn;
  const currentTeamName = currentState.turn === 'TEAM1' ? match.team1_name : match.team2_name;

  // Actions
  const handleMapAction = async (mapName: string) => {
    if (!isMyTurn || loading) return;
    
    // Check nếu map đã bị ban/pick thì không bấm được
    const isUsed = match.veto_log?.some((l: VetoLog) => l.map === mapName && l.action !== 'SIDE_PICK');
    if (isUsed) return;

    setLoading(true);
    try {
      await api.post(`/api/matches/${match.id}/veto`, { mapName });
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi thao tác");
    } finally {
      setLoading(false);
    }
  };

  const handleSidePick = async (side: 'CT' | 'T') => {
    if (!isMyTurn || loading) return;
    setLoading(true);
    try {
      await api.post(`/api/matches/${match.id}/veto`, { side });
    } catch (error: any) {
        alert(error.response?.data?.message || "Lỗi thao tác");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: GIAO DIỆN CHỌN SIDE (PICK SIDE UI) ---
  if (currentState.type === 'SIDE_PICK') {
    const mapInfo = maps.find(m => m.map_key === currentState.mapRef);
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center animate-in zoom-in duration-300">
        <h2 className="text-2xl text-white font-bold mb-2">
            {currentTeamName} ơi, hãy chọn phe!
        </h2>
        <p className="text-slate-400 mb-6">Map: <span className="text-orange-500 font-bold">{mapInfo?.display_name || currentState.mapRef}</span></p>
        
        <div className="flex justify-center gap-8">
            <button 
                onClick={() => handleSidePick('CT')}
                disabled={!isMyTurn}
                className={clsx(
                    "w-40 h-40 rounded-xl border-4 flex flex-col items-center justify-center gap-2 transition-all",
                    "bg-blue-900/40 border-blue-500 hover:bg-blue-800",
                    !isMyTurn && "opacity-50 cursor-not-allowed"
                )}
            >
                <Shield size={48} className="text-blue-400"/>
                <span className="font-black text-2xl text-blue-400">CT SIDE</span>
                <span className="text-xs text-blue-200">Defenders</span>
            </button>

            <button 
                onClick={() => handleSidePick('T')}
                disabled={!isMyTurn}
                className={clsx(
                    "w-40 h-40 rounded-xl border-4 flex flex-col items-center justify-center gap-2 transition-all",
                    "bg-yellow-900/40 border-yellow-500 hover:bg-yellow-800",
                    !isMyTurn && "opacity-50 cursor-not-allowed"
                )}
            >
                <Swords size={48} className="text-yellow-500"/>
                <span className="font-black text-2xl text-yellow-500">T SIDE</span>
                <span className="text-xs text-yellow-200">Attackers</span>
            </button>
        </div>
        {!isMyTurn && <p className="mt-6 text-slate-500 animate-pulse">Đang đợi đối thủ chọn...</p>}
      </div>
    );
  }

  // --- RENDER: GIAO DIỆN MAP GRID (BAN/PICK UI) ---
  return (
    <div className="space-y-6">
      {/* Turn Indicator */}
      <div className={clsx(
        "p-4 rounded-lg border text-center transition-colors relative overflow-hidden",
        currentState.turn === 'TEAM1' ? "bg-orange-900/20 border-orange-500/50" : "bg-blue-900/20 border-blue-500/50"
      )}>
        <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
            {currentState.type === 'BAN' ? 'Lượt Cấm Map (Ban)' : 'Lượt Chọn Map (Pick)'}
        </p>
        <h2 className={clsx(
            "text-3xl font-black uppercase",
            currentState.turn === 'TEAM1' ? "text-orange-500" : "text-blue-500"
        )}>
            {currentTeamName}
        </h2>
        {isMyTurn && (
            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-bl">
                Đến lượt bạn!
            </div>
        )}
      </div>

      {/* Grid Maps */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {maps.map((map) => {
            // Check status của từng map trong log
            const logEntry = match.veto_log?.find((l: VetoLog) => l.map === map.map_key && l.action !== 'SIDE_PICK');
            const isBanned = logEntry?.action === 'BAN';
            const isPicked = logEntry?.action === 'PICK';
            const isDisabled = !!logEntry; // Đã dùng rồi

            return (
                <div 
                    key={map.map_key}
                    onClick={() => !isDisabled && handleMapAction(map.map_key)}
                    className={clsx(
                        "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all group",
                        // Styles cho Map đã Ban
                        isBanned && "border-red-900 grayscale opacity-40 cursor-not-allowed",
                        // Styles cho Map đã Pick
                        isPicked && "border-green-500 ring-2 ring-green-500/50 z-10 cursor-not-allowed",
                        // Styles cho Map Active (chưa đụng tới)
                        !isDisabled && isMyTurn && "border-slate-600 cursor-pointer hover:border-white hover:scale-105 hover:shadow-xl",
                        !isDisabled && !isMyTurn && "border-slate-800 opacity-70 cursor-wait"
                    )}
                >
                    {/* Background Image */}
                    <img src={map.image_url} alt={map.display_name} className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                        <span className="font-bold text-white text-lg leading-none">{map.display_name}</span>
                        
                        {/* Status Label */}
                        {isBanned && <span className="text-red-500 font-black text-xl mt-1 flex items-center gap-1"><Ban size={16}/> BANNED</span>}
                        {isPicked && <span className="text-green-400 font-black text-xl mt-1 flex items-center gap-1"><CheckCircle2 size={16}/> PICKED</span>}
                        
                        {/* Hover hint for active user */}
                        {!isDisabled && isMyTurn && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <span className={clsx("font-bold px-3 py-1 rounded border", 
                                    currentState.type === 'BAN' ? "border-red-500 text-red-500 bg-red-500/10" : "border-green-500 text-green-500 bg-green-500/10"
                                )}>
                                    BẤM ĐỂ {currentState.type}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Team Badge (Ai đã ban/pick?) */}
                    {logEntry && (
                        <div className={clsx("absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded text-white", 
                            logEntry.team === 'TEAM1' ? "bg-orange-600" : "bg-blue-600"
                        )}>
                            {logEntry.team === 'TEAM1' ? match.team1_name : match.team2_name}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}