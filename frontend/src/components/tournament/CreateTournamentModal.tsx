import { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import api from '../../services/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTournamentModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await api.post('/api/tournaments/create', {
        name,
        format: 'SINGLE_ELIMINATION', // Hardcoded for now
        max_teams: 8
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500"/> Tạo Giải Đấu Mới
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tên giải đấu</label>
            <input 
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-yellow-500 outline-none"
              placeholder="Ví dụ: Summer Cup 2025"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded font-bold disabled:opacity-50"
            >
                {loading ? 'Đang tạo...' : 'Tạo Giải'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
