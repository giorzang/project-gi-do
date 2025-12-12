import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { Match } from '../types/common';
import api from '../services/api';
import { Plus, Users, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateMatchModal from '../components/match/CreateMatchModal';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMatches = () => {
    api.get('/api/matches')
       .then(res => setMatches(res.data))
       .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchMatches();
    // Có thể thêm setInterval để auto-refresh mỗi 10s nếu muốn
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sảnh Chờ</h1>
            <p className="text-slate-400">Chọn trận đấu để tham gia hoặc tạo trận mới.</p>
        </div>
        {user && user.is_admin === 1 && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20"
            >
                <Plus size={20} /> Tạo Trận Đấu
            </button>
        )}
      </div>

      {/* Grid Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(match => (
            <div 
                key={match.id} 
                onClick={() => navigate(`/matches/${match.id}`)}
                className="group bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-orange-500/5 relative"
            >
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                            match.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            match.status === 'FINISHED' ? 'bg-slate-700/50 text-slate-400 border-slate-700' :
                            'bg-green-500/10 text-green-500 border-green-500/20'
                        }`}>
                            {match.status}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{match.series_type}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors truncate">
                        {match.display_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                        <Monitor size={14} /> Server #{match.server_id}
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                        <div className="text-center w-[45%]">
                            <div className="font-bold text-slate-200 truncate">{match.team1_name}</div>
                        </div>
                        {match.status === 'FINISHED' && (match.team1_series_score !== undefined && match.team2_series_score !== undefined) ? (
                            <div className="flex-shrink-0 font-mono font-bold text-lg text-white">
                                <span className={match.winner_team === 'team1' ? 'text-green-400' : 'text-slate-400'}>{match.team1_series_score}</span>
                                <span className="text-orange-500 mx-1">-</span>
                                <span className={match.winner_team === 'team2' ? 'text-green-400' : 'text-slate-400'}>{match.team2_series_score}</span>
                            </div>
                        ) : (
                            <div className="font-mono font-bold text-orange-500">VS</div>
                        )}
                        <div className="text-center w-[45%]">
                            <div className="font-bold text-slate-200 truncate">{match.team2_name}</div>
                        </div>
                    </div>
                </div>
                {/* Hover Effect */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </div>
        ))}

        {matches.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
                <Users size={48} className="mx-auto text-slate-600 mb-4"/>
                <p className="text-slate-500">Chưa có trận đấu nào được tạo.</p>
            </div>
        )}
      </div>

      {showCreateModal && (
        <CreateMatchModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={fetchMatches}
        />
      )}
    </div>
  );
}