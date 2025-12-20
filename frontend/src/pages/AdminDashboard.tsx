import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, Server, Map, Swords, Trophy,
    ChevronLeft, Settings, Activity, UserCheck, UserX,
    Plus, Trash2, ToggleLeft, ToggleRight, Search, Wifi,
    Edit2, X, Check
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

// Types
interface Stats {
    totalUsers: number;
    totalMatches: number;
    liveMatches: number;
    ongoingTournaments: number;
    newUsersThisWeek: number;
}

interface UserData {
    id: string;
    username: string;
    avatar_url: string;
    is_admin: number;
    is_banned: number;
    created_at: string;
}

interface ServerData {
    id: number;
    display_name: string;
    ip: string;
    port: number;
    rcon_password?: string;
    is_active: number;
}

interface MapData {
    map_key: string;
    display_name: string;
    image_url: string;
    is_competitive?: number;
    is_wingman?: number;
}

// Sidebar Menu
const MENU_ITEMS = [
    { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { key: 'users', label: 'Người dùng', icon: Users },
    { key: 'servers', label: 'Servers', icon: Server },
    { key: 'maps', label: 'Maps', icon: Map },
    { key: 'matches', label: 'Trận đấu', icon: Swords },
    { key: 'tournaments', label: 'Giải đấu', icon: Trophy },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    // Data states
    const [users, setUsers] = useState<UserData[]>([]);
    const [servers, setServers] = useState<ServerData[]>([]);
    const [maps, setMaps] = useState<MapData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showServerModal, setShowServerModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [editingServer, setEditingServer] = useState<ServerData | null>(null);
    const [editingMap, setEditingMap] = useState<MapData | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'servers') fetchServers();
        if (activeTab === 'maps') fetchMaps();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchServers = async () => {
        try {
            const res = await api.get('/api/admin/servers');
            setServers(res.data);
        } catch (error) {
            console.error('Failed to fetch servers', error);
        }
    };

    const fetchMaps = async () => {
        try {
            const res = await api.get('/api/admin/maps');
            setMaps(res.data);
        } catch (error) {
            console.error('Failed to fetch maps', error);
        }
    };

    // User Actions
    const toggleAdmin = async (userId: string, currentStatus: number) => {
        try {
            await api.put(`/api/admin/users/${userId}/role`, { is_admin: currentStatus === 1 ? 0 : 1 });
            fetchUsers();
        } catch (error) {
            alert('Lỗi khi thay đổi quyền admin');
        }
    };

    const toggleBan = async (userId: string, currentStatus: number) => {
        try {
            await api.put(`/api/admin/users/${userId}/ban`, { is_banned: currentStatus === 1 ? 0 : 1 });
            fetchUsers();
        } catch (error) {
            alert('Lỗi khi ban/unban user');
        }
    };

    // Server Actions
    const toggleServerActive = async (serverId: number, currentStatus: number) => {
        try {
            await api.put(`/api/admin/servers/${serverId}`, { is_active: currentStatus === 1 ? 0 : 1 });
            fetchServers();
        } catch (error) {
            alert('Lỗi khi thay đổi trạng thái server');
        }
    };

    const deleteServer = async (serverId: number) => {
        if (!confirm('Xác nhận xóa server này?')) return;
        try {
            await api.delete(`/api/admin/servers/${serverId}`);
            fetchServers();
        } catch (error) {
            alert('Lỗi khi xóa server');
        }
    };

    const testRcon = async (serverId: number) => {
        try {
            const res = await api.post(`/api/admin/servers/${serverId}/test-rcon`);
            alert(res.data.message || 'Kết nối thành công!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Kết nối thất bại');
        }
    };

    // Map Actions
    const deleteMap = async (mapKey: string) => {
        if (!confirm('Xác nhận xóa map này?')) return;
        try {
            await api.delete(`/api/admin/maps/${mapKey}`);
            fetchMaps();
        } catch (error) {
            alert('Lỗi khi xóa map');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.includes(searchQuery)
    );

    return (
        <div className="flex min-h-[calc(100vh-65px)]">
            {/* Sidebar */}
            <aside className="w-56 bg-slate-900 border-r border-slate-800 p-4 shrink-0">
                <div className="flex items-center gap-2 mb-6 px-2">
                    <Settings className="text-orange-500" size={20} />
                    <span className="font-bold text-white">Admin Panel</span>
                </div>

                <nav className="space-y-1">
                    {MENU_ITEMS.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === item.key
                                    ? "bg-orange-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-4 border-t border-slate-800">
                    <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-white px-3 py-2">
                        <ChevronLeft size={16} /> Về trang chủ
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">Tổng quan</h1>

                        {loading ? (
                            <p className="text-slate-400">Đang tải...</p>
                        ) : stats ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatCard label="Tổng Users" value={stats.totalUsers} icon={Users} color="blue" />
                                <StatCard label="Tổng Matches" value={stats.totalMatches} icon={Swords} color="green" />
                                <StatCard label="Đang Live" value={stats.liveMatches} icon={Activity} color="red" />
                                <StatCard label="Giải đang chạy" value={stats.ongoingTournaments} icon={Trophy} color="yellow" />
                            </div>
                        ) : (
                            <p className="text-red-400">Không thể tải thống kê</p>
                        )}

                        {stats && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="font-bold text-white mb-4">Users mới trong tuần</h3>
                                <p className="text-3xl font-bold text-green-400">+{stats.newUsersThisWeek}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-white">Quản lý Người dùng</h1>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc SteamID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white w-72 focus:border-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">User</th>
                                        <th className="px-4 py-3 text-left">SteamID</th>
                                        <th className="px-4 py-3 text-center">Admin</th>
                                        <th className="px-4 py-3 text-center">Trạng thái</th>
                                        <th className="px-4 py-3 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                                    <span className="font-medium text-white">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 font-mono text-sm">{user.id}</td>
                                            <td className="px-4 py-3 text-center">
                                                {user.is_admin === 1 ? (
                                                    <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs font-bold">ADMIN</span>
                                                ) : (
                                                    <span className="text-slate-500 text-xs">User</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {user.is_banned === 1 ? (
                                                    <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs">BANNED</span>
                                                ) : (
                                                    <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">Active</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                                                        className={clsx(
                                                            "p-1.5 rounded transition-colors",
                                                            user.is_admin === 1 ? "text-red-400 hover:bg-red-900/30" : "text-blue-400 hover:bg-blue-900/30"
                                                        )}
                                                        title={user.is_admin === 1 ? "Xóa quyền Admin" : "Cấp quyền Admin"}
                                                    >
                                                        {user.is_admin === 1 ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleBan(user.id, user.is_banned)}
                                                        className={clsx(
                                                            "p-1.5 rounded transition-colors",
                                                            user.is_banned === 1 ? "text-green-400 hover:bg-green-900/30" : "text-orange-400 hover:bg-orange-900/30"
                                                        )}
                                                        title={user.is_banned === 1 ? "Unban" : "Ban"}
                                                    >
                                                        {user.is_banned === 1 ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Servers Tab */}
                {activeTab === 'servers' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-white">Quản lý Servers</h1>
                            <button
                                onClick={() => { setEditingServer(null); setShowServerModal(true); }}
                                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                                <Plus size={18} /> Thêm Server
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {servers.map(server => (
                                <div key={server.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            server.is_active === 1 ? "bg-green-500" : "bg-slate-600"
                                        )} />
                                        <div>
                                            <h3 className="font-bold text-white">{server.display_name}</h3>
                                            <p className="text-slate-400 text-sm font-mono">{server.ip}:{server.port}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => testRcon(server.id)}
                                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                                            title="Test RCON"
                                        >
                                            <Wifi size={18} />
                                        </button>
                                        <button
                                            onClick={() => toggleServerActive(server.id, server.is_active)}
                                            className={clsx(
                                                "p-2 rounded",
                                                server.is_active === 1 ? "text-green-400 hover:bg-green-900/30" : "text-slate-500 hover:bg-slate-800"
                                            )}
                                            title={server.is_active === 1 ? "Deactivate" : "Activate"}
                                        >
                                            {server.is_active === 1 ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button
                                            onClick={() => { setEditingServer(server); setShowServerModal(true); }}
                                            className="p-2 text-slate-400 hover:bg-slate-800 rounded"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteServer(server.id)}
                                            className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Server Modal */}
                        {showServerModal && (
                            <ServerModal
                                server={editingServer}
                                onClose={() => setShowServerModal(false)}
                                onSave={() => { setShowServerModal(false); fetchServers(); }}
                            />
                        )}
                    </div>
                )}

                {/* Maps Tab */}
                {activeTab === 'maps' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-white">Quản lý Maps</h1>
                            <button
                                onClick={() => { setEditingMap(null); setShowMapModal(true); }}
                                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                                <Plus size={18} /> Thêm Map
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {maps.map(map => (
                                <div key={map.map_key} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden group relative">
                                    <img
                                        src={map.image_url || '/placeholder-map.jpg'}
                                        alt={map.display_name}
                                        className="w-full aspect-video object-cover"
                                    />
                                    <div className="p-3">
                                        <h3 className="font-bold text-white">{map.display_name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-slate-500 text-xs font-mono">{map.map_key}</p>
                                            <div className="flex gap-1">
                                                {map.is_competitive === 1 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-orange-900/50 text-orange-400">COMP</span>
                                                )}
                                                {map.is_wingman === 1 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-900/50 text-blue-400">WM</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => { setEditingMap(map); setShowMapModal(true); }}
                                            className="p-2 rounded-full bg-blue-600 text-white"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => deleteMap(map.map_key)}
                                            className="p-2 rounded-full bg-red-600 text-white"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map Modal */}
                        {showMapModal && (
                            <MapModal
                                map={editingMap}
                                onClose={() => setShowMapModal(false)}
                                onSave={() => { setShowMapModal(false); fetchMaps(); }}
                            />
                        )}
                    </div>
                )}

                {/* Matches Tab */}
                {activeTab === 'matches' && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">Quản lý Trận đấu</h1>
                        <p className="text-slate-400">Đang phát triển...</p>
                    </div>
                )}

                {/* Tournaments Tab */}
                {activeTab === 'tournaments' && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">Quản lý Giải đấu</h1>
                        <p className="text-slate-400">Đang phát triển...</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ========== COMPONENTS ==========

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
        green: 'bg-green-900/30 text-green-400 border-green-800',
        red: 'bg-red-900/30 text-red-400 border-red-800',
        yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    };

    return (
        <div className={clsx("rounded-xl border p-5", colors[color])}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm opacity-80">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <Icon size={32} className="opacity-50" />
            </div>
        </div>
    );
}

// Server Modal Component
function ServerModal({ server, onClose, onSave }: { server: ServerData | null; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({
        display_name: server?.display_name || '',
        ip: server?.ip || '',
        port: server?.port || 27015,
        rcon_password: server?.rcon_password || '',
        is_active: server?.is_active ?? 1
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (server) {
                await api.put(`/api/admin/servers/${server.id}`, form);
            } else {
                await api.post('/api/admin/servers', form);
            }
            onSave();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi lưu server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white">{server ? 'Sửa Server' : 'Thêm Server'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Tên Server</label>
                        <input
                            value={form.display_name}
                            onChange={e => setForm({ ...form, display_name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">IP</label>
                            <input
                                value={form.ip}
                                onChange={e => setForm({ ...form, ip: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Port</label>
                            <input
                                type="number"
                                value={form.port}
                                onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">RCON Password</label>
                        <input
                            type="password"
                            value={form.rcon_password}
                            onChange={e => setForm({ ...form, rcon_password: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
                        <button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
                            {loading ? 'Đang lưu...' : <><Check size={18} /> Lưu</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Map Modal Component  
function MapModal({ map, onClose, onSave }: { map: MapData | null; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({
        map_key: map?.map_key || '',
        display_name: map?.display_name || '',
        image_url: map?.image_url || '',
        is_competitive: map?.is_competitive ?? 1,
        is_wingman: map?.is_wingman ?? 0
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (map) {
                await api.put(`/api/admin/maps/${map.map_key}`, form);
            } else {
                await api.post('/api/admin/maps', form);
            }
            onSave();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi lưu map');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white">{map ? 'Sửa Map' : 'Thêm Map'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Map Key</label>
                        <input
                            value={form.map_key}
                            onChange={e => setForm({ ...form, map_key: e.target.value })}
                            placeholder="de_dust2"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Tên hiển thị</label>
                        <input
                            value={form.display_name}
                            onChange={e => setForm({ ...form, display_name: e.target.value })}
                            placeholder="Dust 2"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">URL Hình ảnh</label>
                        <input
                            value={form.image_url}
                            onChange={e => setForm({ ...form, image_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Map pool (có thể chọn cả 2)</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_competitive === 1}
                                    onChange={e => setForm({ ...form, is_competitive: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 accent-orange-500"
                                />
                                <span className={clsx("text-sm font-medium", form.is_competitive === 1 ? "text-orange-400" : "text-slate-400")}>
                                    Competitive (7 map)
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_wingman === 1}
                                    onChange={e => setForm({ ...form, is_wingman: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 accent-blue-500"
                                />
                                <span className={clsx("text-sm font-medium", form.is_wingman === 1 ? "text-blue-400" : "text-slate-400")}>
                                    Wingman (5 map)
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
                        <button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
                            {loading ? 'Đang lưu...' : <><Check size={18} /> Lưu</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
