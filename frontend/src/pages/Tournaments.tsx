import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, Play, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Tournament } from '../types/common';

export default function Tournaments() {
    const { user } = useAuthStore();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await api.post('/api/tournaments', { name: newName });
            setShowCreate(false);
            setNewName('');
            fetchTournaments();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi tạo giải đấu');
        } finally {
            setCreating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'REGISTRATION':
                return <span className="flex items-center gap-1 text-blue-400 bg-blue-900/30 px-2 py-1 rounded text-xs font-bold"><Clock size={12} /> Đăng ký</span>;
            case 'ONGOING':
                return <span className="flex items-center gap-1 text-green-400 bg-green-900/30 px-2 py-1 rounded text-xs font-bold animate-pulse"><Play size={12} /> Đang diễn ra</span>;
            case 'FINISHED':
                return <span className="flex items-center gap-1 text-slate-400 bg-slate-700/30 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={12} /> Kết thúc</span>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Trophy className="text-yellow-500" /> Giải Đấu
                    </h1>
                    <p className="text-slate-400 mt-1">Các giải đấu đang mở và đã hoàn thành</p>
                </div>

                {user?.is_admin === 1 && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors shadow-lg shadow-yellow-600/20"
                    >
                        <Plus size={20} /> Tạo Giải
                    </button>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4 text-yellow-500 flex items-center gap-2"><Trophy size={20} /> Tạo Giải Đấu Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tên giải đấu</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-yellow-500 outline-none"
                                    placeholder="VD: giORZang Cup Season 1"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
                                <button type="submit" disabled={creating} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded font-bold">
                                    {creating ? 'Đang tạo...' : 'Tạo Giải'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tournament List */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">Đang tải...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map(t => (
                        <Link
                            to={`/tournaments/${t.id}`}
                            key={t.id}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                {getStatusBadge(t.status)}
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar size={12} /> {new Date(t.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold group-hover:text-yellow-400 transition-colors flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" /> {t.name}
                            </h3>
                        </Link>
                    ))}

                    {tournaments.length === 0 && (
                        <div className="col-span-full text-center py-16 border border-dashed border-slate-800 rounded-xl text-slate-500">
                            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Chưa có giải đấu nào.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
