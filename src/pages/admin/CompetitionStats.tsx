import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import { ArrowLeft, BarChart3, Users, Trophy, Clock, Calendar } from 'lucide-react'

interface LeaderRow { rank: number; name: string; score: number; timeSpent: number; rewards?: { xp: number; coins: number } }

export const AdminCompetitionStats = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  console.log('id', id, loading)
  const [comp, setComp] = useState<any>(null)
  const [rows, setRows] = useState<LeaderRow[]>([])

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [compRes, lbRes] = await Promise.all([
        api.get(`/competitions/${id}`),
        api.get(`/competitions/${id}/leaderboard`)
      ])
      setComp(compRes.data)
      setRows(lbRes.data?.leaderboard || [])
    } catch (e) {
      setRows([])
    } finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    const count = rows.length
    const avg = count ? rows.reduce((s, r) => s + r.score, 0) / count : 0
    const max = rows.reduce((m, r) => Math.max(m, r.score || 0), 0)
    const min = rows.reduce((m, r) => Math.min(m, r.score || 100), 100)
    // buckets: 0-49, 50-69, 70-79, 80-89, 90-100
    const buckets = [0,0,0,0,0]
    rows.forEach(r => {
      const s = r.score || 0
      if (s < 50) buckets[0]++
      else if (s < 70) buckets[1]++
      else if (s < 80) buckets[2]++
      else if (s < 90) buckets[3]++
      else buckets[4]++
    })
    return { count, avg, max, min, buckets }
  }, [rows])

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/competitions')} className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 p-0">
             <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary" />
                Phân tích giải đấu
             </h1>
             <p className="text-gray-500 font-medium">{comp?.title || 'Đang truy xuất dữ liệu...'}</p>
          </div>
        </div>
        
        {comp && (
          <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase tracking-widest ${
            comp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {comp.status}
          </Badge>
        )}
      </div>

      {comp && (
        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                 <h3 className="text-2xl font-black text-gray-900">{comp.title}</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xl italic">"{comp.description}"</p>
                 <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" /> {new Date(comp.startDate).toLocaleDateString('vi-VN')}</span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-primary" /> {new Date(comp.endDate).toLocaleDateString('vi-VN')}</span>
                 </div>
              </div>
              <div className="chinese-gradient p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 text-center min-w-[160px] transform hover:rotate-3 transition-transform">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Cấp độ thi</p>
                 <p className="text-3xl font-black">HSK {comp.level}</p>
              </div>
           </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Người tham dự', val: stats.count, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Điểm trung bình', val: `${Math.round(stats.avg)}%`, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Cao nhất', val: `${Math.round(stats.max)}%`, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Thấp nhất', val: `${Math.round(stats.min)}%`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:rotate-6`}>
                <stat.icon className="w-6 h-6" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
             <p className="text-2xl font-black text-gray-900">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-10">
               <h3 className="text-xl font-black text-gray-900 flex items-center">
                  <div className="w-2 h-6 chinese-gradient rounded-full mr-3" />
                  Bảng xếp hạng tổng kết
               </h3>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-50">
                           <th className="pb-4 text-[10px] font-black uppercase text-gray-400">Hạng</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-gray-400">Đấu thủ</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-gray-400 text-center">Điểm số</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-gray-400 text-right">Phần thưởng</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {rows.map((r, i) => (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="py-5">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                  i === 0 ? 'bg-yellow-400 text-white shadow-lg' :
                                  i === 1 ? 'bg-gray-300 text-white shadow-lg' :
                                  i === 2 ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-300'
                                }`}>
                                   {r.rank}
                                </span>
                             </td>
                             <td className="py-5">
                                <p className="text-sm font-black text-gray-900 leading-none mb-1 group-hover:text-primary transition-colors">{r.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.timeSpent}s Execution</p>
                             </td>
                             <td className="py-5 text-center">
                                <Badge className="bg-primary/5 text-primary border-none rounded-lg font-black text-xs">{Math.round(r.score)}%</Badge>
                             </td>
                             <td className="py-5 text-right">
                                {r.rewards ? (
                                  <div className="space-y-0.5">
                                     <p className="text-xs font-black text-amber-500">+{r.rewards.coins} Xu</p>
                                     <p className="text-[9px] font-bold text-primary uppercase">+{r.rewards.xp} XP</p>
                                  </div>
                                ) : <span className="text-[10px] font-bold text-gray-300">-</span>}
                             </td>
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold italic">Chưa có kết quả tham gia.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-8">
            <h3 className="text-xl font-black text-gray-900 flex items-center">
               <div className="w-2 h-6 chinese-gradient rounded-full mr-3" />
               Phân bố kết quả
            </h3>
            
            <div className="space-y-10 flex flex-col justify-center h-full pb-10">
               <div className="flex items-end justify-between gap-2 px-4">
                  {stats.buckets.map((v, i) => {
                    const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-blue-400','chinese-gradient shadow-lg shadow-primary/20']
                    const height = stats.count ? Math.max(8, Math.round((v / stats.count) * 180)) : 8
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar cursor-help">
                         <div className={`${colors[i]} w-full rounded-2xl transition-all duration-500 group-hover/bar:scale-x-110`} style={{ height }} />
                         <span className="text-[10px] font-black text-gray-400">{v}</span>
                      </div>
                    )
                  })}
               </div>
               
               <div className="grid grid-cols-1 gap-2 pt-6 border-t border-gray-50">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Chú giải (Buckets)</p>
                  {[
                    { label: 'Tuyệt đỉnh (90-100%)', color: 'bg-primary' },
                    { label: 'Thành thạo (80-89%)', color: 'bg-blue-400' },
                    { label: 'Cơ bản (70-79%)', color: 'bg-yellow-400' },
                    { label: 'Yếu (50-69%)', color: 'bg-orange-400' },
                    { label: 'Kém (<50%)', color: 'bg-red-400' }
                  ].map((l, i) => (
                    <div key={i} className="flex items-center space-x-2">
                       <div className={`w-2 h-2 rounded-full ${l.color}`} />
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{l.label}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

export default AdminCompetitionStats


