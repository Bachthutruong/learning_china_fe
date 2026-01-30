import { useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Calendar, CheckCircle2, Flame, Gift, Loader2, Star, BookOpen, Gem } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = {
  learnedTodayCount: number
  requiredToCheckin: number
  checkedInToday: boolean
  streak: number
  daysToBonus: number
  eligible: boolean
}

export function Checkin() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/checkin/status')
      setStatus(res.data)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi tải trạng thái điểm danh')
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleCheckin = async () => {
    if (!status?.eligible) return
    setLoading(true)
    try {
      const res = await api.post('/checkin')
      toast.success(res.data?.message || 'Điểm danh thành công')
      await fetchStatus()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Điểm danh thất bại')
    } finally {
      setLoading(false)
    }
  }

  const progress = status ? Math.min((status.learnedTodayCount / status.requiredToCheckin) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-6">
              <Calendar className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Điểm danh <span className="text-primary">Mỗi ngày</span></h1>
           <p className="text-gray-500 font-medium">Duy trì thói quen học tập để nhận những phần quà hấp dẫn từ Jiudi.</p>
        </div>

        {!status ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center space-y-4">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Đang kết nối dữ liệu...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 chinese-gradient opacity-5 rounded-bl-[4rem]" />
               
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ hôm nay</p>
                     <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-black text-gray-900">{status.learnedTodayCount}</span>
                        <span className="text-xl font-bold text-gray-400">/ {status.requiredToCheckin} từ mới</span>
                     </div>
                  </div>
                  
                  <div className="bg-primary/5 px-6 py-4 rounded-[2rem] border border-primary/10 flex items-center space-x-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Flame className="w-6 h-6 text-primary fill-current animate-pulse" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Học liên tiếp</p>
                        <p className="text-xl font-black text-gray-900">{status.streak} Ngày</p>
                     </div>
                  </div>
               </div>

               <div className="relative z-10 space-y-3 mb-10">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                     <div 
                       className="h-full chinese-gradient rounded-full transition-all duration-1000 ease-out"
                       style={{ width: `${progress}%` }}
                     />
                  </div>
                  <p className="text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                     {progress < 100 ? `Cần thêm ${status.requiredToCheckin - status.learnedTodayCount} từ để điểm danh` : 'Sẵn sàng điểm danh!'}
                  </p>
               </div>

               <div className="relative z-10 grid md:grid-cols-3 gap-4">
                  {[
                    { icon: BookOpen, label: 'Nhiệm vụ', value: 'Học 3 từ mới', color: 'text-blue-500' },
                    { icon: Gem, label: 'Thưởng', value: '+30 Xu & XP', color: 'text-amber-500' },
                    { icon: Gift, label: 'Bonus', value: 'Chuỗi 7 ngày', color: 'text-primary' }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-1">
                       <div className={`w-8 h-8 rounded-lg ${item.color} bg-current/10 flex items-center justify-center mb-2`}>
                          <item.icon className="w-4 h-4" />
                       </div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                       <p className="text-xs font-bold text-gray-700">{item.value}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <Button
                 onClick={handleCheckin}
                 disabled={!status.eligible || status.checkedInToday || loading}
                 className={`w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all transform active:scale-95 ${
                   status.checkedInToday
                     ? 'bg-green-500 text-white shadow-green-200'
                     : status.eligible
                     ? 'chinese-gradient text-white shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1'
                     : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                 }`}
               >
                 {status.checkedInToday ? (
                   <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Đã hoàn thành hôm nay</span>
                   </div>
                 ) : loading ? (
                   <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                 ) : (
                   status.eligible ? 'Xác nhận điểm danh' : `Học đủ ${status.requiredToCheckin} từ để mở khóa`
                 )}
               </Button>

               {!status.checkedInToday && (
                 <p className="text-center text-sm font-bold text-gray-400 flex items-center justify-center">
                    <Star className="w-4 h-4 mr-2 text-amber-400 fill-current" />
                    Chỉ còn {status.daysToBonus} ngày nữa để nhận rương báu chuỗi học tập!
                 </p>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}