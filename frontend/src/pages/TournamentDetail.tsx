import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Play, CheckCircle, Clock, Newspaper, Swords, Users, Plus, Trash2, Calendar, Edit2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, Eye, Code, List, Pen, ArrowLeft, UserPlus, Crown, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Tournament, Post } from '../types/common';
import clsx from 'clsx';

// Markdown Libraries
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';

type TabType = 'announcements' | 'matches' | 'teams';

interface Team {
    id: number;
    name: string;
    captain_id: string;
    captain_name: string;
    captain_avatar: string;
    members: TeamMember[];
    pending_requests: JoinRequest[];
}

interface TeamMember {
    user_id: string;
    username: string;
    avatar_url: string;
    role: 'CAPTAIN' | 'MEMBER';
}

interface JoinRequest {
    id: number;
    user_id: string;
    username: string;
    avatar_url: string;
    created_at: string;
}

export default function TournamentDetail() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('announcements');

    // Posts state
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editPostId, setEditPostId] = useState<number | null>(null);
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [savingPost, setSavingPost] = useState(false);
    const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Teams state
    const [teams, setTeams] = useState<Team[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);

    // Find user's team status
    const myTeam = teams.find(t => t.captain_id === user?.id || t.members.some(m => m.user_id === user?.id));
    const myPendingRequest = teams.find(t => t.pending_requests?.some(r => r.user_id === user?.id));
    const isCaptain = myTeam?.captain_id === user?.id;

    // Fetch functions
    const fetchTournament = () => {
        api.get(`/api/tournaments/${id}`)
            .then(res => setTournament(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchPosts = () => {
        setLoadingPosts(true);
        api.get(`/api/tournaments/${id}/posts`)
            .then(res => setPosts(res.data))
            .catch(console.error)
            .finally(() => setLoadingPosts(false));
    };

    const fetchTeams = () => {
        setLoadingTeams(true);
        api.get(`/api/tournaments/${id}/teams`)
            .then(res => setTeams(res.data))
            .catch(console.error)
            .finally(() => setLoadingTeams(false));
    };

    useEffect(() => {
        fetchTournament();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'announcements') fetchPosts();
        if (activeTab === 'teams') fetchTeams();
    }, [activeTab, id]);

    // Post handlers
    const handleOpenCreatePost = () => {
        setEditPostId(null);
        setPostTitle('');
        setPostContent('');
        setEditorTab('write');
        setShowPostModal(true);
    };

    const handleOpenEditPost = (post: Post) => {
        setEditPostId(post.id);
        setPostTitle(post.title);
        setPostContent(post.content);
        setEditorTab('write');
        setShowPostModal(true);
    };

    const handleSavePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postTitle.trim() || !postContent.trim()) return;
        setSavingPost(true);
        try {
            if (editPostId) {
                await api.put(`/api/tournaments/${id}/posts/${editPostId}`, { title: postTitle, content: postContent });
            } else {
                await api.post(`/api/tournaments/${id}/posts`, { title: postTitle, content: postContent });
            }
            setShowPostModal(false);
            fetchPosts();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi lưu bài');
        } finally {
            setSavingPost(false);
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!confirm('Xóa thông báo này?')) return;
        try {
            await api.delete(`/api/tournaments/${id}/posts/${postId}`);
            fetchPosts();
        } catch (e) { console.error(e); }
    };

    // Markdown helpers
    const applyMarkdown = (syntax: string, placeholder?: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        let newText = value.substring(0, start) + syntax + value.substring(end);
        let cursorOffset = start + syntax.length;
        if (placeholder) {
            newText = value.substring(0, start) + syntax.replace(placeholder, placeholder) + value.substring(end);
            cursorOffset = start + syntax.indexOf(placeholder) + placeholder.length;
        }
        setPostContent(newText);
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = cursorOffset;
            }
        }, 0);
    };

    const handleInsertImageClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            applyMarkdown(`![${file.name}](${res.data.url})`, file.name);
        } catch (error: any) {
            alert('Lỗi upload: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleInsertLink = () => {
        const url = prompt('Nhập URL:');
        if (url) applyMarkdown(`[Link](${url})`, 'Link');
    };

    // Team handlers
    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        setCreatingTeam(true);
        try {
            await api.post(`/api/tournaments/${id}/teams`, { name: newTeamName });
            setShowCreateTeam(false);
            setNewTeamName('');
            fetchTeams();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi tạo đội');
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleJoinTeam = async (teamId: number) => {
        try {
            await api.post(`/api/tournaments/${id}/teams/${teamId}/join`);
            fetchTeams();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi gửi yêu cầu');
        }
    };

    const handleApproveRequest = async (teamId: number, requestId: number) => {
        try {
            await api.post(`/api/tournaments/${id}/teams/${teamId}/approve/${requestId}`);
            fetchTeams();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi duyệt');
        }
    };

    const handleRejectRequest = async (teamId: number, requestId: number) => {
        try {
            await api.delete(`/api/tournaments/${id}/teams/${teamId}/reject/${requestId}`);
            fetchTeams();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi từ chối');
        }
    };

    // Tournament actions
    const handleStartTournament = async () => {
        if (!confirm('Bắt đầu giải đấu? Cây đấu sẽ được tạo.')) return;
        try {
            await api.post(`/api/tournaments/${id}/start`);
            fetchTournament();
        } catch (error: any) {
            alert('Lỗi: ' + error.response?.data?.message);
        }
    };

    if (loading || !tournament) {
        return <div className="text-center p-10 text-white">Đang tải...</div>;
    }

    const getStatusBadge = () => {
        switch (tournament.status) {
            case 'REGISTRATION':
                return <span className="flex items-center gap-1 text-blue-400"><Clock size={16} /> Đang đăng ký</span>;
            case 'ONGOING':
                return <span className="flex items-center gap-1 text-green-400 animate-pulse"><Play size={16} /> Đang diễn ra</span>;
            case 'FINISHED':
                return <span className="flex items-center gap-1 text-slate-400"><CheckCircle size={16} /> Đã kết thúc</span>;
        }
    };

    const tabs = [
        { id: 'announcements' as TabType, label: 'Thông báo', icon: Newspaper },
        { id: 'matches' as TabType, label: 'Trận đấu', icon: Swords },
        { id: 'teams' as TabType, label: 'Đội tham gia', icon: Users },
    ];

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* Header */}
            <div className="mb-6">
                <Link to="/tournaments" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm mb-4">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-yellow-500">
                            <Trophy /> {tournament.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-slate-400">
                            {getStatusBadge()}
                        </div>
                    </div>
                    {user?.is_admin === 1 && tournament.status === 'REGISTRATION' && (
                        <button onClick={handleStartTournament} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 shadow-lg">
                            <Play size={20} /> Bắt đầu giải
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-700 mb-6">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all -mb-[1px]',
                                activeTab === tab.id
                                    ? 'border-yellow-500 text-yellow-500'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab: Announcements */}
            {activeTab === 'announcements' && (
                <div className="max-w-4xl">
                    {user?.is_admin === 1 && (
                        <button onClick={handleOpenCreatePost} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 mb-6">
                            <Plus size={20} /> Đăng thông báo
                        </button>
                    )}

                    {loadingPosts ? (
                        <div className="text-center py-10 text-slate-500">Đang tải...</div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map(post => (
                                <div key={post.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={post.avatar_url} alt={post.username} className="w-10 h-10 rounded-full border border-slate-600" />
                                            <div>
                                                <span className="font-bold text-slate-200 block">{post.username}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(post.created_at).toLocaleDateString()} lúc {new Date(post.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                        {user?.is_admin === 1 && (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditPost(post)} className="text-slate-500 hover:text-white p-2 bg-slate-900 rounded"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeletePost(post.id)} className="text-slate-500 hover:text-red-500 p-2 bg-slate-900 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3">{post.title}</h2>
                                    <div className="text-slate-300 prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500">
                                    <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Chưa có thông báo nào.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Matches */}
            {activeTab === 'matches' && (
                <div>
                    {tournament.matches && tournament.matches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tournament.matches.map(match => (
                                <Link to={`/matches/${match.id}`} key={match.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={clsx("px-2 py-1 rounded text-xs font-bold uppercase",
                                            match.status === 'LIVE' ? "bg-red-900 text-red-400 animate-pulse" :
                                                match.status === 'FINISHED' ? "bg-slate-700 text-slate-400" : "bg-blue-900 text-blue-400"
                                        )}>
                                            {match.status}
                                        </div>
                                        <span className="text-xs text-slate-500">Vòng {match.bracket_round}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 rounded p-3">
                                        <div className="text-center flex-1">
                                            <span className={clsx("block font-bold truncate", match.winner_team === 'team1' ? "text-green-400" : "text-white")}>{match.team1_name || 'TBD'}</span>
                                            <span className={clsx("text-2xl font-black", match.winner_team === 'team1' ? "text-green-400" : "text-slate-400")}>{match.team1_series_score || 0}</span>
                                        </div>
                                        <div className="text-slate-600 font-bold px-2">VS</div>
                                        <div className="text-center flex-1">
                                            <span className={clsx("block font-bold truncate", match.winner_team === 'team2' ? "text-green-400" : "text-white")}>{match.team2_name || 'TBD'}</span>
                                            <span className={clsx("text-2xl font-black", match.winner_team === 'team2' ? "text-green-400" : "text-slate-400")}>{match.team2_series_score || 0}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500">
                            <Swords size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Chưa có trận đấu. Giải đấu cần được bắt đầu để tạo cây đấu.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Teams */}
            {activeTab === 'teams' && (
                <div>
                    {/* Create Team Button */}
                    {user && !myTeam && !myPendingRequest && tournament.status === 'REGISTRATION' && (
                        <button onClick={() => setShowCreateTeam(true)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 mb-6">
                            <Plus size={20} /> Tạo Đội
                        </button>
                    )}

                    {myPendingRequest && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
                            <p className="text-yellow-400">Bạn đang chờ duyệt vào đội <strong>{myPendingRequest.name}</strong></p>
                        </div>
                    )}

                    {loadingTeams ? (
                        <div className="text-center py-10 text-slate-500">Đang tải...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {teams.map(team => (
                                <div key={team.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="text-yellow-500" size={20} /> {team.name}
                                        </h3>
                                        {!myTeam && !myPendingRequest && user && tournament.status === 'REGISTRATION' && (
                                            <button
                                                onClick={() => handleJoinTeam(team.id)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                            >
                                                <UserPlus size={14} /> Xin vào
                                            </button>
                                        )}
                                    </div>

                                    {/* Team Members */}
                                    <div className="space-y-2">
                                        {/* Captain */}
                                        <div className="flex items-center gap-3 bg-slate-900/50 rounded p-2">
                                            <img src={team.captain_avatar} alt={team.captain_name} className="w-8 h-8 rounded-full" />
                                            <span className="font-medium text-white">{team.captain_name}</span>
                                            <Crown size={14} className="text-yellow-500" />
                                        </div>
                                        {/* Members */}
                                        {team.members.filter(m => m.role !== 'CAPTAIN').map(member => (
                                            <div key={member.user_id} className="flex items-center gap-3 bg-slate-900/50 rounded p-2">
                                                <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full" />
                                                <span className="text-slate-300">{member.username}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pending Requests (Captain only) */}
                                    {isCaptain && team.id === myTeam?.id && team.pending_requests && team.pending_requests.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <h4 className="text-sm font-bold text-slate-400 mb-2">Yêu cầu tham gia ({team.pending_requests.length})</h4>
                                            <div className="space-y-2">
                                                {team.pending_requests.map(req => (
                                                    <div key={req.id} className="flex items-center justify-between bg-slate-900/50 rounded p-2">
                                                        <div className="flex items-center gap-2">
                                                            <img src={req.avatar_url} alt={req.username} className="w-6 h-6 rounded-full" />
                                                            <span className="text-sm text-slate-300">{req.username}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleApproveRequest(team.id, req.id)} className="p-1 bg-green-600 hover:bg-green-500 rounded"><Check size={14} /></button>
                                                            <button onClick={() => handleRejectRequest(team.id, req.id)} className="p-1 bg-red-600 hover:bg-red-500 rounded"><X size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {teams.length === 0 && (
                                <div className="col-span-full text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500">
                                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Chưa có đội nào đăng ký.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create Team Modal */}
            {showCreateTeam && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4 text-green-500 flex items-center gap-2"><Users size={20} /> Tạo Đội Mới</h3>
                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tên đội</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                    placeholder="VD: Team giORZang"
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-slate-500">Bạn sẽ trở thành Captain và có quyền duyệt thành viên.</p>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateTeam(false)} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
                                <button type="submit" disabled={creatingTeam} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
                                    {creatingTeam ? 'Đang tạo...' : 'Tạo Đội'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-3xl p-6 max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-white">{editPostId ? 'Chỉnh sửa thông báo' : 'Đăng thông báo mới'}</h3>
                        <form onSubmit={handleSavePost} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-yellow-500 outline-none font-bold"
                                placeholder="Tiêu đề..."
                                value={postTitle}
                                onChange={e => setPostTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex-1 flex flex-col border border-slate-700 rounded overflow-hidden min-h-0">
                                <div className="bg-slate-800 p-2 border-b border-slate-700 flex gap-2 shrink-0">
                                    <button type="button" onClick={() => applyMarkdown('**text**', 'text')} className="p-1 rounded hover:bg-slate-700 text-slate-300"><Bold size={18} /></button>
                                    <button type="button" onClick={() => applyMarkdown('*text*', 'text')} className="p-1 rounded hover:bg-slate-700 text-slate-300"><Italic size={18} /></button>
                                    <button type="button" onClick={handleInsertLink} className="p-1 rounded hover:bg-slate-700 text-slate-300"><LinkIcon size={18} /></button>
                                    <button type="button" onClick={handleInsertImageClick} className="p-1 rounded hover:bg-slate-700 text-slate-300"><ImageIcon size={18} /></button>
                                    <button type="button" onClick={() => applyMarkdown('`code`', 'code')} className="p-1 rounded hover:bg-slate-700 text-slate-300"><Code size={18} /></button>
                                    <button type="button" onClick={() => applyMarkdown('- List\n- Item', 'List')} className="p-1 rounded hover:bg-slate-700 text-slate-300"><List size={18} /></button>
                                    <div className="flex-grow" />
                                    <button type="button" onClick={() => setEditorTab('write')} className={clsx('p-1 rounded', editorTab === 'write' ? 'bg-yellow-600 text-white' : 'hover:bg-slate-700 text-slate-300')}><Pen size={18} /></button>
                                    <button type="button" onClick={() => setEditorTab('preview')} className={clsx('p-1 rounded', editorTab === 'preview' ? 'bg-yellow-600 text-white' : 'hover:bg-slate-700 text-slate-300')}><Eye size={18} /></button>
                                </div>
                                {editorTab === 'write' ? (
                                    <div className="flex-1 overflow-y-auto bg-slate-950">
                                        <TextareaAutosize
                                            ref={textareaRef}
                                            className="w-full bg-slate-950 p-3 text-white focus:outline-none resize-none min-h-full"
                                            placeholder="Nội dung (Markdown)..."
                                            value={postContent}
                                            onChange={e => setPostContent(e.target.value)}
                                            minRows={15}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-slate-950 p-3 overflow-y-auto prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{postContent || 'Xem trước...'}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 shrink-0 pt-2">
                                <button type="button" onClick={() => setShowPostModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Hủy</button>
                                <button type="submit" disabled={savingPost} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded font-bold">
                                    {savingPost ? 'Đang lưu...' : (editPostId ? 'Cập nhật' : 'Đăng')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
