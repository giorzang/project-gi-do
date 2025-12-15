import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, Users } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Tournament } from '../types/common';
import CreateTournamentModal from '../components/tournament/CreateTournamentModal';
import clsx from 'clsx';

export default function Tournaments() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = () => {
    setLoading(true);
    api.get('/api/tournaments')
      .then(res => setTournaments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="text-yellow-500" /> Giải Đấu
            </h1>
            <p className="text-slate-400 mt-1">Danh sách các giải đấu đang diễn ra</p>
        </div>
        {user?.is_admin === 1 && (
            <button 
                onClick={() => setShowCreate(true)}
                className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
            >
                <Plus size={20}/> Tạo Giải
            </button>
        )}
      </div>

      {loading ? (
          <div className="text-center py-10 text-slate-500">Đang tải...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map(t => (
                  <Link to={`/tournaments/${t.id}`} key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-yellow-500/50 hover:bg-slate-750 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                          <div className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", 
                              t.status === 'ONGOING' ? "bg-green-900 text-green-400" : (t.status === 'FINISHED' ? "bg-slate-700 text-slate-400" : "bg-blue-900 text-blue-400")
                          )}>
                              {t.status}
                          </div>
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Calendar size={12}/> {new Date(t.created_at).toLocaleDateString()}
                          </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">{t.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1"><Users size={14}/> {t.max_teams} Teams</span>
                          <span>•</span>
                          <span>{t.format === 'SINGLE_ELIMINATION' ? 'Loại trực tiếp' : 'Nhánh thắng thua'}</span>
                      </div>
                  </Link>
              ))}
              {tournaments.length === 0 && (
                  <div className="col-span-full text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-500">
                      Chưa có giải đấu nào.
                  </div>
              )}
          </div>
      )}

      {showCreate && (
          <CreateTournamentModal 
            onClose={() => setShowCreate(false)} 
            onSuccess={fetchTournaments}
          />
      )}
    </div>
  );
}
