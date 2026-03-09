import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Star, 
  Zap, 
  Gem, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  TestTube, 
  Trophy,
  Target,
  Award,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const Dashboard = () => {
  const { user, setUser } = useAuth()
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [levelInfo, setLevelInfo] = useState<{ currentLevel: number; requiredXP?: number; progress?: number; nextLevel?: number } | null>(null)

  useEffect(() => { (async () => { try { const res = await api.get('/users/profile'); setLevelInfo(res.data.user.levelInfo); if (res.data.user.level && user) setUser({ ...user, level: res.data.user.level }) } catch {} })() }, [])

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true); const res = await api.post('/users/checkin')
      if (user) setUser({ ...user, level: res.data.user.level, experience: res.data.user.experience, coins: res.data.user.coins, streak: res.data.user.streak })
      toast.success('Check-in thành công!')
    } catch { toast.error('Bạn đã check-in hôm nay rồi') } finally { setIsCheckingIn(false) }
  }

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true); const res = await api.post('/users/recalculate-level')
      if (user) setUser({ ...user, level: res.data.user.level, experience: res.data.user.experience, coins: res.data.user.coins })
      setLevelInfo(res.data.levelInfo); toast.success('Đã cập nhật cấp độ')
    } catch { toast.error('Lỗi cập nhật') } finally { setIsRecalculating(false) }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 sm:p-6 md:p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div><h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Chào mừng, {user?.name?.split(' ')[0]}!</h1><p className="text-gray-500 font-medium text-sm sm:text-base">Bứt phá giới hạn Hán ngữ của bạn hôm nay.</p></div>
          <div className="flex bg-white p-2 rounded-2xl border gap-4 sm:gap-6 px-4 sm:px-6 shrink-0">
             <div className="text-center"><p className="text-[10px] font-black text-gray-400">STREAK</p><p className="text-lg sm:text-xl font-black text-primary flex items-center justify-center"><Zap className="w-4 h-4 mr-1 fill-current shrink-0" /> {user?.streak || 0}</p></div>
             <div className="text-center"><p className="text-[10px] font-black text-gray-400">XU</p><p className="text-lg sm:text-xl font-black text-amber-500 flex items-center justify-center"><Gem className="w-4 h-4 mr-1 fill-current shrink-0" /> {user?.coins || 0}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Card className="lg:col-span-2 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border shadow-xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center chinese-gradient rounded-full text-white font-black text-2xl sm:text-3xl shadow-lg shrink-0">{user?.level || 1}</div>
                <div className="flex-1 space-y-4 w-full min-w-0">
                   <div><h3 className="text-lg sm:text-xl font-bold">Tiến độ Level</h3><p className="text-xs sm:text-sm text-gray-500">{(levelInfo?.requiredXP || 0) - (user?.experience || 0)} XP nữa để lên cấp.</p></div>
                   <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full chinese-gradient transition-all" style={{ width: `${levelInfo?.progress || 0}%` }} /></div>
                </div>
                <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating} className="rounded-xl font-bold w-full sm:w-auto min-h-[44px]">{isRecalculating ? <Loader2 className="animate-spin" /> : <TrendingUp className="mr-2" />} Đồng bộ</Button>
             </div>
          </Card>

          <div onClick={handleCheckIn} className="bg-primary rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl cursor-pointer group min-h-[140px] flex items-stretch">
             <div className="absolute inset-0 chinese-gradient opacity-90" /><div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between"><Calendar /><Badge className="bg-white/20">Daily</Badge></div>
                <div><h3 className="text-2xl font-black">Check-in</h3><p className="text-white/70 text-sm">Nhận thưởng mỗi ngày.</p></div>
                <Button className="bg-white text-primary rounded-xl font-black">{isCheckingIn ? <Loader2 className="animate-spin" /> : 'Check-in ngay'}</Button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
           {[ { t: 'Học từ vựng', i: BookOpen, h: '/vocabulary-learning', c: 'bg-blue-500' }, { t: 'Làm bài test', i: TestTube, h: '/tests', c: 'bg-purple-500' }, { t: 'Năng lực', i: Target, h: '/proficiency', c: 'bg-green-500' }, { t: 'Giải đấu', i: Trophy, h: '/competition', c: 'bg-orange-500' } ].map((a, i) => {
             const Icon = a.i
             return (
               <Link key={i} to={a.h} className="group min-h-[120px] sm:min-h-[140px] active:scale-[0.98] transition-transform"><div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border shadow-sm group-hover:shadow-xl transition-all text-center h-full flex flex-col items-center justify-center"><div className={`w-10 h-10 sm:w-12 sm:h-12 ${a.c} rounded-xl mx-auto flex items-center justify-center text-white shadow-lg mb-2 sm:mb-4`}><Icon className="w-5 h-5 sm:w-6 sm:h-6" /></div><h4 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-primary">{a.t}</h4></div></Link>
             )
           })}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
           <div className="lg:col-span-2 space-y-4 sm:space-y-6"><h2 className="text-lg sm:text-xl font-black flex items-center"><Star className="mr-2 text-amber-500 fill-current w-5 h-5" /> Thành tích</h2><div className="grid sm:grid-cols-2 gap-3 sm:gap-4">{[ { t: 'Người mới', i: Award }, { t: 'Chăm chỉ', i: Calendar } ].map((a, i) => (
             <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm flex items-center space-x-3 sm:space-x-4"><div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl chinese-gradient text-white flex items-center justify-center shrink-0"><a.i className="w-5 h-5 sm:w-6 sm:h-6" /></div><h4 className="font-bold text-sm sm:text-base">{a.t}</h4><div className="ml-auto text-green-500 shrink-0"><CheckCircle className="w-5 h-5" /></div></div>
           ))}</div></div>
           <div className="space-y-4 sm:space-y-6"><h2 className="text-lg sm:text-xl font-black flex items-center"><TrendingUp className="mr-2 text-blue-600 w-5 h-5" /> Lịch sử</h2><div className="bg-white rounded-xl sm:rounded-[2rem] p-4 sm:p-6 border shadow-sm space-y-4"> { [ { l: 'Bài Test', x: '+50' }, { l: 'Từ vựng', x: '+30' } ].map((h, i) => <div key={i} className="flex justify-between font-bold text-sm sm:text-base"><span>{h.l}</span><span className="text-green-600">{h.x} XP</span></div>) } <Button variant="ghost" className="w-full min-h-[44px]">Xem tất cả</Button></div></div>
        </div>
      </div>
    </div>
  )
}