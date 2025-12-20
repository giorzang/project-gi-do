import { useState, useEffect } from 'react';
import { X, Swords, Gamepad2, Users } from 'lucide-react';
import api from '../../services/api';
import clsx from 'clsx';

interface ServerOption {
  id: number;
  display_name: string;
  ip: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMatchModal({ onClose, onSuccess }: Props) {
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState<'competitive' | 'wingman'>('competitive');

  const [formData, setFormData] = useState({
    display_name: '',
    team1_name: 'Players',
    team2_name: 'Bots',
    series_type: 'BO1',
    server_id: ''
  });

  // Load danh sách server khi mở modal
  useEffect(() => {
    api.get('/api/matches/servers')
      .then(res => {
        setServers(res.data);
        // Chọn mặc định server đầu tiên nếu có
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, server_id: res.data[0].id }));
        }
      })
      .catch(err => console.error("Lỗi tải server", err));
  }, []);

  // Reset BO5 to BO3 when switching to wingman
  useEffect(() => {
    if (gameMode === 'wingman' && formData.series_type === 'BO5') {
      setFormData(prev => ({ ...prev, series_type: 'BO3' }));
    }
  }, [gameMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/matches/create', {
        ...formData,
        server_id: Number(formData.server_id),
        game_mode: gameMode
      });
      onSuccess(); // Báo ra ngoài là tạo xong rồi
      onClose();   // Đóng modal
    } catch (error) {
      alert("Lỗi tạo match: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords size={20} className="text-orange-500" /> Tạo Trận Đấu Mới
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tên phòng</label>
            <input
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-orange-500 outline-none"
              placeholder="Ví dụ: Scrim Navi vs Faze"
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
            />
          </div>

          {/* Game Mode Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Chế độ chơi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode('competitive')}
                className={clsx(
                  "p-2 rounded border text-center text-sm transition-all",
                  gameMode === 'competitive'
                    ? "border-orange-500 bg-orange-900/30 text-orange-400"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                )}
              >
                <Gamepad2 size={18} className="mx-auto mb-1" />
                <span className="font-bold">Competitive</span>
              </button>
              <button
                type="button"
                onClick={() => setGameMode('wingman')}
                className={clsx(
                  "p-2 rounded border text-center text-sm transition-all",
                  gameMode === 'wingman'
                    ? "border-blue-500 bg-blue-900/30 text-blue-400"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                )}
              >
                <Users size={18} className="mx-auto mb-1" />
                <span className="font-bold">Wingman</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Team 1</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                value={formData.team1_name}
                onChange={e => setFormData({ ...formData, team1_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Team 2</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                value={formData.team2_name}
                onChange={e => setFormData({ ...formData, team2_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Thể thức</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                value={formData.series_type}
                onChange={e => setFormData({ ...formData, series_type: e.target.value })}
              >
                <option value="BO1">Best of 1</option>
                <option value="BO3">Best of 3</option>
                {gameMode !== 'wingman' && <option value="BO5">Best of 5</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Server</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                value={formData.server_id}
                onChange={e => setFormData({ ...formData, server_id: e.target.value })}
              >
                {servers.map(s => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
