import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Trophy, 
  Calendar, 
  // Clock, 
  Users, 
  Target, 
  Gem, 
  TrendingUp, 
  Crown, 
  Medal, 
  Loader2, 
  ArrowLeft,
  Diamond,
  Award
} from 'lucide-react'
import { Badge } from '../components/ui/badge'

interface Competition {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  participants: number | any[]
  cost: number
  reward: { xp: number; coins: number }
  level: string | any
}

interface LeaderboardEntry { rank: number; name: string; score: number; avatar?: string; user?: any }

export const CompetitionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const getComputedStatus = (c: Competition) => {
    const now = new Date()
    const start = new Date(c.startDate)
    const end = new Date(c.endDate)
    if (now < start) return 'upcoming'
    if (now > end) return 'ended'
    return 'active'
  }

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const compRes = await api.get(`/competitions/${id}`)
        setCompetition(compRes.data.competition || compRes.data)
        let lbRes
        try { lbRes = await api.get(`/competitions/${id}/leaderboard`) } 
        catch { lbRes = await api.get('/competitions/leaderboard') }
        const list = (lbRes.data.leaderboard || []).map((p: any, i: number) => ({
          ...p,
          name: typeof p.name === 'string' ? p.name : (p.user?.name || p.user?.email || `Người chơi ${i+1}`)
        }))
        setLeaderboard(list)
      } catch (e) {
        toast.error('Không thể tải chi tiết cuộc thi')
      } finally { setLoading(false) }
    })()
  }, [id])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Medal className="h-5 w-5 text-amber-600" />
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>
    }
  }

  const joinCompetition = async () => {
    if (!competition) return
    try {
      await api.post('/competitions/join', { competitionId: competition._id })
      toast.success('Đã tham gia cuộc thi!')
      navigate('/competition')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tham gia')
    }
  }

  if (loading || !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải chi tiết cuộc thi...</p>
        </div>
      </div>
    )
  }

  const status = getComputedStatus(competition)

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/competition')}
            className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          
          <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase tracking-widest ${
            status === 'active' ? 'bg-green-100 text-green-700' :
            status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {status === 'active' ? 'Đang diễn ra' : status === 'upcoming' ? 'Sắp bắt đầu' : 'Đã kết thúc'}
          </Badge>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[4rem]" />
           
           <div className="relative z-10 space-y-8">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                 <div className="w-20 h-20 chinese-gradient rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-3 mb-6">
                    <Trophy className="w-10 h-10 text-white" />
                 </div>
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight">{competition.title}</h1>
                 <p className="text-gray-500 font-medium leading-relaxed italic">"{competition.description}"</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-50">
                 {[
                   { icon: Calendar, label: 'Bắt đầu', value: new Date(competition.startDate).toLocaleDateString('vi-VN'), color: 'text-blue-500' },
                   { icon: Users, label: 'Tham gia', value: `${Array.isArray(competition.participants) ? competition.participants.length : competition.participants} người`, color: 'text-green-500' },
                   { icon: Target, label: 'Cấp độ', value: typeof competition.level === 'string' ? competition.level : (competition.level?.name || 'HSK 1-6'), color: 'text-purple-500' },
                   { icon: Diamond, label: 'Lệ phí', value: `${competition.cost} Xu`, color: 'text-amber-500' }
                 ].map((item, i) => (
                   <div key={i} className="text-center space-y-1">
                      <div className={`w-10 h-10 rounded-xl ${item.color} bg-current/10 flex items-center justify-center mx-auto mb-2`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                      <p className="text-sm font-black text-gray-900">{item.value}</p>
                   </div>
                 ))}
              </div>

              <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
                       <Award className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary">Phần thưởng tối đa</p>
                       <p className="text-xl font-black text-gray-900 flex items-center">
                          +{competition.reward.xp} XP & +{competition.reward.coins} <Gem className="w-4 h-4 ml-1 fill-amber-500 text-amber-500" />
                       </p>
                    </div>
                 </div>
                 <Button 
                   onClick={joinCompetition} 
                   disabled={status !== 'active'} 
                   className="h-14 px-10 chinese-gradient text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none"
                 >
                   {status === 'active' ? 'Tham gia ngay' : 'Đã đóng đăng ký'}
                 </Button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 flex items-center">
                 <TrendingUp className="w-6 h-6 mr-2 text-primary" />
                 Bảng vàng vinh danh
              </h2>
           </div>

           <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
              <div className="p-8 space-y-4">
                 {leaderboard.length === 0 ? (
                   <div className="text-center py-12 text-gray-400 font-bold italic">Chưa có dữ liệu xếp hạng.</div>
                 ) : (
                   <div className="grid gap-3">
                      {leaderboard.slice(0, 10).map((player, idx) => (
                        <div key={idx} className={`flex items-center p-5 rounded-2xl border transition-all ${
                          idx === 0 ? 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/5' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-sm'
                        }`}>
                           <div className="w-12 flex justify-center shrink-0">
                              {getRankIcon(player.rank)}
                           </div>
                           <Avatar className="h-12 w-12 rounded-xl shadow-md border-2 border-white ring-1 ring-gray-100">
                              <AvatarImage src={player.avatar} alt={player.name} />
                              <AvatarFallback className="bg-gray-200 text-gray-500 font-black">{player.name?.charAt(0).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <div className="ml-6 flex-1 min-w-0">
                              <p className={`font-black text-lg truncate ${idx === 0 ? 'text-primary' : 'text-gray-900'}`}>{player.name}</p>
                              <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                 <span className="bg-gray-100 px-2 py-0.5 rounded">Level {player.user?.level || 1}</span>
                                 <span>•</span>
                                 <span>{player.score} Điểm tích lũy</span>
                              </div>
                           </div>
                           <div className="text-right shrink-0">
                              <div className="text-xl font-black text-gray-900">{player.score}</div>
                              <p className="text-[10px] font-black uppercase text-gray-400">Points</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              
              <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Top 10 High Scorers</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}