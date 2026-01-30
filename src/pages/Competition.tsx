import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Trophy, 
  Clock, 
  Users, 
  Target, 
  Calendar,
  Gem,
  TrendingUp,
  Loader2,
  Diamond,
  Zap
} from 'lucide-react'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Competition {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  participants: number | any[]
  cost: number
  reward: { xp: number; coins: number }
  status: 'active' | 'upcoming' | 'ended'
  level: string | any
}

export const Competition = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/competitions')
      setCompetitions(response.data.competitions || [])
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
      toast.error('Không thể tải danh sách cuộc thi')
    } finally {
      setLoading(false)
    }
  }

  const joinCompetition = async (competitionId: string, cost: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tham gia cuộc thi')
      return
    }

    if (user.coins < cost) {
      toast.error('Bạn không đủ xu để tham gia cuộc thi này')
      return
    }

    try {
      await api.post('/competitions/join', { competitionId })
      toast.success('Đã tham gia cuộc thi thành công!')
      fetchCompetitions()
    } catch (error: any) {
      console.error('Failed to join competition:', error)
      const message = error.response?.data?.message || 'Không thể tham gia cuộc thi'
      toast.error(message)
    }
  }

  const getComputedStatus = (c: Competition) => {
    const now = new Date()
    const start = new Date(c.startDate)
    const end = new Date(c.endDate)
    if (now < start) return 'upcoming'
    if (now > end) return 'ended'
    return 'active'
  }

  const getStatusBadge = (c: Competition) => {
    const status = getComputedStatus(c)
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Đang diễn ra</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Sắp diễn ra</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Đã kết thúc</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải cuộc thi...</p>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header/Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
             <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Đấu trường trí tuệ</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                Cuộc thi <span className="text-primary">Ngôn ngữ</span>
             </h1>
             <p className="text-gray-500 font-medium">
                Thử thách kỹ năng tiếng Trung của bạn với hàng ngàn học viên khác và giành những phần thưởng hấp dẫn.
             </p>
          </div>
  
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Competitions List */}
            <div className="lg:col-span-2 space-y-6">
              {competitions.length === 0 ? (
                <div className="bg-white p-20 rounded-[2.5rem] border border-gray-100 shadow-sm text-center space-y-4">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <Trophy className="w-10 h-10" />
                   </div>
                   <p className="text-gray-500 font-bold">Hiện chưa có cuộc thi nào đang diễn ra.</p>
                </div>
              ) : (
                competitions.map((competition) => (
                  <div 
                    key={competition._id} 
                    className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-5 rounded-bl-[4rem]" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                       <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                             <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{competition.title}</h3>
                             {getStatusBadge(competition)}
                          </div>
                          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-md">
                             {competition.description}
                          </p>
                       </div>
                       <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Thưởng tối đa</p>
                          <p className="text-xl font-black text-amber-500 flex items-center justify-center">
                             <Gem className="w-5 h-5 mr-1 fill-current" /> {competition.reward.coins} Xu
                          </p>
                       </div>
                    </div>
  
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pt-8 border-t border-gray-50">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</p>
                          <div className="flex items-center text-sm font-bold text-gray-700">
                             <Calendar className="w-4 h-4 mr-2 text-primary" />
                             {new Date(competition.startDate).toLocaleDateString('vi-VN')}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tham gia</p>
                          <div className="flex items-center text-sm font-bold text-gray-700">
                             <Users className="w-4 h-4 mr-2 text-blue-500" />
                             {Array.isArray(competition.participants) ? competition.participants.length : competition.participants} người
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cấp độ</p>
                          <div className="flex items-center text-sm font-bold text-gray-700">
                             <Target className="w-4 h-4 mr-2 text-green-500" />
                             {typeof competition.level === 'string' ? competition.level : (competition.level?.name || 'HSK 1-6')}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lệ phí</p>
                          <div className="flex items-center text-sm font-bold text-gray-700">
                             <Diamond className="w-4 h-4 mr-2 text-amber-500" />
                             {competition.cost} Xu
                          </div>
                       </div>
                    </div>
  
                    <div className="relative z-10 flex flex-wrap gap-3">
                      <Button
                        onClick={() => joinCompetition(competition._id, competition.cost)}
                        disabled={getComputedStatus(competition) !== 'active'}
                        className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                      >
                        {getComputedStatus(competition) === 'active' ? 'Tham gia đấu trường' : 'Chưa mở đăng ký'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/competition/${competition._id}`)}
                        className="h-12 px-8 rounded-xl font-bold border-2 border-gray-100 hover:border-primary hover:text-primary transition-all"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
  
            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
                 <h3 className="text-xl font-black text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Thống kê đấu trường
                 </h3>
                 
                 <div className="space-y-6">
                    {[
                      { label: 'Tổng cuộc thi', value: competitions.length, color: 'bg-blue-50 text-blue-600', icon: Trophy },
                      { label: 'Đang diễn ra', value: competitions.filter(c => getComputedStatus(c) === 'active').length, color: 'bg-green-50 text-green-600', icon: Zap },
                      { label: 'Sắp bắt đầu', value: competitions.filter(c => getComputedStatus(c) === 'upcoming').length, color: 'bg-amber-50 text-amber-600', icon: Clock }
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer">
                         <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                               <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">{stat.label}</span>
                         </div>
                         <span className="text-lg font-black text-gray-900">{stat.value}</span>
                      </div>
                    ))}
                 </div>
  
                 <div className="pt-8 border-t border-gray-50">
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center space-y-3">
                       <p className="text-sm font-bold text-primary italic">"Học tiếng Trung là một hành trình marathon, không phải một cuộc chạy nước rút."</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">— Jiudi Master</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}