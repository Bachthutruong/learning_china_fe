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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div><h1 className="text-4xl font-black text-gray-900">Chào mừng, {user?.name?.split(' ')[0]}!</h1><p className="text-gray-500 font-medium">Bứt phá giới hạn Hán ngữ của bạn hôm nay.</p></div>
          <div className="flex bg-white p-2 rounded-2xl border gap-4 px-6">
             <div className="text-center"><p className="text-[10px] font-black text-gray-400">STREAK</p><p className="text-xl font-black text-primary flex items-center"><Zap className="w-4 h-4 mr-1 fill-current" /> {user?.streak || 0}</p></div>
             <div className="text-center"><p className="text-[10px] font-black text-gray-400">XU</p><p className="text-xl font-black text-amber-500 flex items-center"><Gem className="w-4 h-4 mr-1 fill-current" /> {user?.coins || 0}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] p-8 border shadow-xl relative overflow-hidden">
             <div className="relative z-10 flex items-center gap-8">
                <div className="relative w-24 h-24 flex items-center justify-center chinese-gradient rounded-full text-white font-black text-3xl shadow-lg">{user?.level || 1}</div>
                <div className="flex-1 space-y-4">
                   <div><h3 className="text-xl font-bold">Tiến độ Level</h3><p className="text-sm text-gray-500">{(levelInfo?.requiredXP || 0) - (user?.experience || 0)} XP nữa để lên cấp.</p></div>
                   <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full chinese-gradient transition-all" style={{ width: `${levelInfo?.progress || 0}%` }} /></div>
                </div>
                <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating} className="rounded-xl font-bold">{isRecalculating ? <Loader2 className="animate-spin" /> : <TrendingUp className="mr-2" />} Đồng bộ</Button>
             </div>
          </Card>

          <div onClick={handleCheckIn} className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl cursor-pointer group">
             <div className="absolute inset-0 chinese-gradient opacity-90" /><div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between"><Calendar /><Badge className="bg-white/20">Daily</Badge></div>
                <div><h3 className="text-2xl font-black">Check-in</h3><p className="text-white/70 text-sm">Nhận thưởng mỗi ngày.</p></div>
                <Button className="bg-white text-primary rounded-xl font-black">{isCheckingIn ? <Loader2 className="animate-spin" /> : 'Check-in ngay'}</Button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           {[ { t: 'Học từ vựng', i: BookOpen, h: '/vocabulary-learning', c: 'bg-blue-500' }, { t: 'Làm bài test', i: TestTube, h: '/tests', c: 'bg-purple-500' }, { t: 'Năng lực', i: Target, h: '/proficiency', c: 'bg-green-500' }, { t: 'Giải đấu', i: Trophy, h: '/competition', c: 'bg-orange-500' } ].map((a, i) => (
             <Link key={i} to={a.h} className="group"><div className="bg-white p-6 rounded-[2rem] border shadow-sm group-hover:shadow-xl transition-all text-center"><div className={`w-12 h-12 ${a.c} rounded-xl mx-auto flex items-center justify-center text-white shadow-lg mb-4`}><a.i /></div><h4 className="font-bold text-gray-900 group-hover:text-primary">{a.t}</h4></div></Link>
           ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6"><h2 className="text-xl font-black flex items-center"><Star className="mr-2 text-amber-500 fill-current" /> Thành tích</h2><div className="grid sm:grid-cols-2 gap-4">{[ { t: 'Người mới', i: Award }, { t: 'Chăm chỉ', i: Calendar } ].map((a, i) => (
             <div key={i} className="bg-white p-5 rounded-3xl border shadow-sm flex items-center space-x-4"><div className="w-12 h-12 rounded-xl chinese-gradient text-white flex items-center justify-center"><a.i /></div><h4 className="font-bold">{a.t}</h4><div className="ml-auto text-green-500"><CheckCircle className="w-5 h-5" /></div></div>
           ))}</div></div>
           <div className="space-y-6"><h2 className="text-xl font-black flex items-center"><TrendingUp className="mr-2 text-blue-600" /> Lịch sử</h2><div className="bg-white rounded-[2rem] p-6 border shadow-sm space-y-4"> { [ { l: 'Bài Test', x: '+50' }, { l: 'Từ vựng', x: '+30' } ].map((h, i) => <div key={i} className="flex justify-between font-bold"><span>{h.l}</span><span className="text-green-600">{h.x} XP</span></div>) } <Button variant="ghost" className="w-full">Xem tất cả</Button></div></div>
        </div>
      </div>
    </div>
  )
}