import React, { useEffect, useState } from 'react';
import { Users, Activity, Crown, Search, ShieldCheck } from 'lucide-react';
import { getAllUsers, getGlobalStats, toggleUserVipAdmin } from '../lib/api';

export function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTonnage: 0, totalWorkouts: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, globalStats] = await Promise.all([
        getAllUsers(),
        getGlobalStats()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setStats(globalStats);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lower = search.toLowerCase();
      setFilteredUsers(users.filter(u => 
        (u.username && u.username.toLowerCase().includes(lower)) || 
        (u.telegramId && String(u.telegramId).includes(lower))
      ));
    }
  }, [search, users]);

  const toggleVip = async (uid: string, currentStatus: boolean) => {
    try {
      await toggleUserVipAdmin(uid, !currentStatus);
      setUsers(users.map(u => u.uid === uid ? { ...u, isVip: !currentStatus } : u));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-[#A1A1AA]">Загрузка данных CRM...</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-6 pt-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <ShieldCheck size={20} className="text-[#CCFF00]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">CRM / Админ</h1>
          <p className="text-[10px] text-[#A1A1AA] uppercase font-bold tracking-wider">Управление Apex Metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex flex-col relative overflow-hidden">
          <Activity size={16} className="text-[#A1A1AA] mb-2" />
          <div className="text-2xl font-bold font-mono tracking-tight text-white mb-1">{stats.totalWorkouts}</div>
          <div className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Тренировок</div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex flex-col relative overflow-hidden">
          <Activity size={16} className="text-[#A1A1AA] mb-2" />
          <div className="text-2xl font-bold font-mono tracking-tight text-white mb-1">{(stats.totalTonnage / 1000).toFixed(1)}k</div>
          <div className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Тоннаж (кг)</div>
        </div>
      </div>

      <div className="bg-black border border-[#262626] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4 bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#262626]">
          <Search size={16} className="text-[#A1A1AA]" />
          <input 
            type="text" 
            placeholder="Поиск по нику или ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-white"
          />
        </div>

        <h3 className="text-xs font-bold uppercase text-[#A1A1AA] mb-3 tracking-wider flex items-center gap-2">
          <Users size={14} /> Пользователи ({filteredUsers.length})
        </h3>
        
        <div className="flex flex-col gap-3">
          {filteredUsers.map(u => (
            <div key={u.uid} className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  @{u.username || 'unknown'}
                  {u.isVip && <Crown size={12} className="text-[#CCFF00]" />}
                </div>
                <div className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">ID: {u.telegramId || u.uid.substring(0, 8)}</div>
              </div>
              <button 
                onClick={() => toggleVip(u.uid, u.isVip)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-colors ${
                  u.isVip 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20'
                }`}
              >
                {u.isVip ? 'Revoke VIP' : 'Grant VIP'}
              </button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center text-[#A1A1AA] text-xs py-4">Не найдено</div>
          )}
        </div>
      </div>
    </div>
  );
}
