import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Play, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Tournament, Match } from '../types/common';
import clsx from 'clsx';

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = () => {
    api.get(`/api/tournaments/${id}`)
      .then(res => setTournament(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStart = async () => {
      if (!confirm("Bắt đầu giải đấu? Cây đấu sẽ được tạo.")) return;
      try {
          await api.post(`/api/tournaments/${id}/start`);
          fetchDetail();
      } catch (error: any) {
          alert("Lỗi: " + error.response?.data?.message);
      }
  };

  if (loading || !tournament) return <div className="text-center p-10 text-white">Đang tải...</div>;

  // Group matches by round
  const round1 = tournament.matches?.filter(m => m.bracket_round === 1) || [];
  const round2 = tournament.matches?.filter(m => m.bracket_round === 2) || [];
  const round3 = tournament.matches?.filter(m => m.bracket_round === 3) || [];

  const MatchNode = ({ match }: { match?: Match }) => {
      if (!match) return <div className="bg-slate-800/50 h-24 rounded border border-slate-700 flex items-center justify-center text-slate-600 text-xs">TBD</div>;
      
      return (
          <Link to={`/matches/${match.id}`} className="block bg-slate-800 border border-slate-700 hover:border-yellow-500 rounded p-2 transition-all relative group h-24 flex flex-col justify-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Match #{match.bracket_match_index}</span>
                  <span className={match.status === 'LIVE' ? "text-red-500 font-bold" : (match.status === 'FINISHED' ? "text-green-500" : "")}>{match.status}</span>
              </div>
              <div className="space-y-1">
                  <div className={clsx("flex justify-between px-2 py-1 rounded text-sm", match.winner_team === 'team1' ? "bg-green-900/30 text-green-400 font-bold" : "bg-slate-900/50")}>
                      <span>{match.team1_name}</span>
                      <span>{match.team1_series_score}</span>
                  </div>
                  <div className={clsx("flex justify-between px-2 py-1 rounded text-sm", match.winner_team === 'team2' ? "bg-green-900/30 text-green-400 font-bold" : "bg-slate-900/50")}>
                      <span>{match.team2_name}</span>
                      <span>{match.team2_series_score}</span>
                  </div>
              </div>
          </Link>
      );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-yellow-500">
                <Trophy /> {tournament.name}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{tournament.format}</span>
                <span>•</span>
                <span>{tournament.max_teams} Teams</span>
            </p>
        </div>
        {user?.is_admin === 1 && tournament.status === 'REGISTRATION' && (
            <button 
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20"
            >
                <Play size={20}/> BẮT ĐẦU GIẢI
            </button>
        )}
        {tournament.status === 'ONGOING' && <span className="text-green-400 font-bold flex items-center gap-2"><Play size={16}/> ĐANG DIỄN RA</span>}
        {tournament.status === 'FINISHED' && <span className="text-slate-400 font-bold flex items-center gap-2"><CheckCircle size={16}/> ĐÃ KẾT THÚC</span>}
      </div>

      {/* BRACKET VIEW */}
      <div className="overflow-x-auto pb-10">
          <div className="min-w-[800px] flex justify-between gap-8">
              {/* ROUND 1: Quarter Finals */}
              <div className="flex-1 flex flex-col justify-around gap-4">
                  <h3 className="text-center text-slate-500 font-bold uppercase mb-4">Tứ Kết</h3>
                  {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="relative">
                          <MatchNode match={round1.find(m => m.bracket_match_index === idx)} />
                          {/* Connector lines logic could go here but simple spacing is enough for MVP */}
                      </div>
                  ))}
              </div>

              {/* ROUND 2: Semi Finals */}
              <div className="flex-1 flex flex-col justify-around gap-16 py-12">
                  <h3 className="text-center text-slate-500 font-bold uppercase mb-4">Bán Kết</h3>
                  {[1, 2].map(idx => (
                      <div key={idx}>
                          <MatchNode match={round2.find(m => m.bracket_match_index === idx)} />
                      </div>
                  ))}
              </div>

              {/* ROUND 3: Final */}
              <div className="flex-1 flex flex-col justify-center py-24">
                  <h3 className="text-center text-yellow-500 font-bold uppercase mb-4 flex justify-center gap-2"><Trophy size={16}/> Chung Kết</h3>
                  <div className="scale-110 origin-center">
                      <MatchNode match={round3[0]} />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
