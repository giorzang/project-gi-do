import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { User } from '../types/common';

interface UserStats extends User {
  total_matches: number;
  total_wins: number;
}

type SortKey = 'total_matches' | 'total_wins';
type SortOrder = 'asc' | 'desc';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortKey, setSortKey] = useState<SortKey>('total_matches');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // Default to desc for new key
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA === valB) return 0;
    const comparison = valA > valB ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Player Leaderboard</h1>
      
      <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-lg">
        <table className="min-w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Player</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('total_matches')}
              >
                Matches Played {sortKey === 'total_matches' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('total_wins')}
              >
                Matches Won {sortKey === 'total_wins' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                  <span className="font-medium">{user.username}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                  {user.total_matches}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                   {user.total_wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                   {user.total_matches > 0 ? ((user.total_wins / user.total_matches) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
