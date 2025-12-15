import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Plus, Monitor } from 'lucide-react';
import api from '../services/api';
import CreateMatchModal from '../components/match/CreateMatchModal';
import { useAuthStore } from '../store/useAuthStore';
import type { Match } from '../types/common';
import clsx from 'clsx';

export default function Matches() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMatches = () => {
    setLoading(true);
    api.get('/api/matches')
      .then(res => setMatches(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <Swords className="text-orange-500" /> Danh Sách Trận Đấu
            </h1>
            <p className="text-slate-400 mt-1">Các trận đấu đang diễn ra và lịch sử</p>
        </div>
        
        {user?.is_admin === 1 && (
            <button 
                onClick={() => setShowCreate(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
            >
                <Plus size={20}/> Tạo Trận
            </button>
        )}
      </div>

      {loading ? (
          <div className="text-center py-10 text-slate-500">Đang tải...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map(match => (
                  <Link to={`/matches/${match.id}`} key={match.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-orange-500/50 hover:bg-slate-750 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                          <div className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", 
                              match.status === 'LIVE' ? "bg-red-900 text-red-400 animate-pulse" : 
                              (match.status === 'FINISHED' ? "bg-slate-700 text-slate-400" : "bg-blue-900 text-blue-400")
                          )}>
                              {match.status}
                          </div>
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Monitor size={12}/> {match.server_name || 'Server #1'}
                          </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors truncate">{match.display_name}</h3>
                      
                      <div className="flex justify-between items-center bg-slate-900/50 rounded p-3">
                          <div className="text-center flex-1">
                              <span className={clsx("block font-bold truncate", match.winner_team === 'team1' ? "text-green-400" : "text-white")}>{match.team1_name}</span>
                              <span className={clsx("text-2xl font-black", match.winner_team === 'team1' ? "text-green-400" : "text-slate-400")}>{match.team1_series_score || 0}</span>
                          </div>
                          <div className="text-slate-600 font-bold px-2">VS</div>
                          <div className="text-center flex-1">
                              <span className={clsx("block font-bold truncate", match.winner_team === 'team2' ? "text-green-400" : "text-white")}>{match.team2_name}</span>
                              <span className={clsx("text-2xl font-black", match.winner_team === 'team2' ? "text-green-400" : "text-slate-400")}>{match.team2_series_score || 0}</span>
                          </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between text-xs text-slate-500">
                          <span>{match.series_type}</span>
                          <span>{new Date(match.created_at).toLocaleDateString()}</span>
                      </div>
                  </Link>
              ))}
              
              {matches.length === 0 && (
                  <div className="col-span-full text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-500">
                      Chưa có trận đấu nào.
                  </div>
              )}
          </div>
      )}

      {showCreate && (
          <CreateMatchModal 
            onClose={() => setShowCreate(false)} 
            onSuccess={fetchMatches}
          />
      )}
    </div>
  );
}
