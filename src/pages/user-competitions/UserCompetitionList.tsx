import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { 
  Trophy, 
  Plus, 
  Users, 
  Clock, 
  Zap,
  Sword,
  Award,
  Crown,
  Medal,
  TrendingUp,
  Loader2,
  Calendar,
  BookOpen,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'

interface UserCompetition {
  _id: string
  title: string
  description: string
  startTime: string
  endTime: string
  numberOfQuestions: number
  totalTime: number
  level: any
  participants: any[]
  creator: any
  status: 'pending' | 'active' | 'completed'
  pendingRequests: string[]
}

interface GlobalRanking {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
    level: number
  }
  totalPoints: number
  competitionsParticipated: number
  rank?: number
}

interface ScoringConfig {
  name: string
  effectiveFrom?: string
  effectiveTo?: string
}

export const UserCompetitionList = () => {
  const [competitions, setCompetitions] = useState<UserCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [globalRankings, setGlobalRankings] = useState<GlobalRanking[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchLevels()
    if (activeTab === 'ranking') {
      fetchGlobalRankings()
    } else {
      fetchCompetitions()
    }
  }, [activeTab, selectedLevel])

  const fetchLevels = async () => {
    try {
      const res = await api.get('/admin/levels')
      setLevels(res.data || [])
    } catch (e) {}
  }

  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const params: any = { status: activeTab === 'my' ? undefined : activeTab }
      if (activeTab === 'my') params.my = 'true'
      if (selectedLevel) params.level = selectedLevel

      const res = await api.get('/user-competitions', { params })
      setCompetitions(res.data.competitions || [])
    } catch (error) {
      toast.error('Không thể tải danh sách cuộc thi')
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalRankings = async () => {
    try {
      setRankingLoading(true)
      const res = await api.get('/competition-ranking/global-ranking')
      setGlobalRankings(res.data.rankings || [])
      setScoringConfigs(res.data.activeConfigs || [])
    } catch (error) {
      toast.error('Không thể tải bảng xếp hạng')
    } finally {
      setRankingLoading(false)
    }
  }

  const getStatusBadge = (comp: UserCompetition) => {
    const now = new Date()
    const start = new Date(comp.startTime)
    const end = new Date(comp.endTime)

    if (now < start) return <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase">Sắp diễn ra</Badge>
    if (now > end) return <Badge className="bg-gray-100 text-gray-500 border-none font-black text-[8px] uppercase">Kết thúc</Badge>
    return <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] uppercase">Đang đấu</Badge>
  }

  const getTimeStatus = (comp: UserCompetition) => {
    const now = new Date()
    const start = new Date(comp.startTime)
    if (now < start) return `Bắt đầu lúc ${start.toLocaleTimeString('vi-VN')} - ${start.toLocaleDateString('vi-VN')}`
    return `Kết thúc lúc ${new Date(comp.endTime).toLocaleTimeString('vi-VN')}`
  }

  const getLevelName = (level: any) => {
    if (typeof level === 'number') return `HSK ${level}`
    if (typeof level === 'object' && level?.name) return level.name
    return `Cấp ${level}`
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center">
               Đấu trường <span className="text-primary ml-3">Bạn hữu</span>
            </h1>
            <p className="text-gray-500 font-medium">Tự do khởi tạo và tranh tài cùng bạn bè trong những đấu trường tri thức riêng biệt.</p>
          </div>
          <Button 
            onClick={() => navigate('/user-competitions/create')}
            className="chinese-gradient h-14 px-8 rounded-2xl font-black text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
          >
            <Plus className="w-6 h-6 mr-2" />
            Tạo đấu trường mới
          </Button>
        </div>

        <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl flex flex-wrap gap-2">
           {[
             { id: 'pending', label: 'Chờ bắt đầu', icon: Clock },
             { id: 'active', label: 'Đang diễn ra', icon: Zap },
             { id: 'completed', label: 'Đã kết thúc', icon: Award },
             { id: 'my', label: 'Của tôi', icon: Users },
             { id: 'ranking', label: 'Bảng vàng toàn hệ thống', icon: Trophy }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center space-x-2 px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all ${
                 activeTab === tab.id
                   ? 'chinese-gradient text-white shadow-lg'
                   : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
               }`}
             >
               <tab.icon className="w-4 h-4" />
               <span>{tab.label}</span>
             </button>
           ))}
        </div>

        {activeTab === 'ranking' && (
          <div className="animate-in fade-in zoom-in duration-500 space-y-8">
             {!rankingLoading && globalRankings.length > 0 && (
               <div className="grid md:grid-cols-3 gap-8 pt-12 items-end">
                  {globalRankings[1] && (
                    <div className="order-2 md:order-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-4 relative overflow-hidden group hover:scale-105 transition-all">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-gray-300 opacity-10 rounded-bl-[4rem]" />
                       <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-black text-gray-400 border-4 border-white shadow-lg">
                             {globalRankings[1].user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-300 rounded-xl shadow-md flex items-center justify-center text-white font-black border-2 border-white">2</div>
                       </div>
                       <div>
                          <p className="text-xl font-black text-gray-900">{globalRankings[1].user.name}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Level {globalRankings[1].user.level}</p>
                       </div>
                       <div className="text-3xl font-black text-gray-400">{globalRankings[1].totalPoints.toLocaleString()} pts</div>
                    </div>
                  )}
                  {globalRankings[0] && (
                    <div className="order-1 md:order-2 bg-white p-10 rounded-[3rem] border-2 border-primary shadow-2xl text-center space-y-6 relative overflow-hidden group hover:scale-105 transition-all ring-8 ring-primary/5">
                       <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-10 rounded-bl-[5rem]" />
                       <div className="relative inline-block">
                          <div className="w-32 h-32 rounded-full chinese-gradient flex items-center justify-center text-5xl font-black text-white border-4 border-white shadow-2xl">
                             {globalRankings[0].user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-2xl shadow-lg flex items-center justify-center text-white font-black border-4 border-white">
                             <Crown className="w-6 h-6" />
                          </div>
                       </div>
                       <div>
                          <p className="text-2xl font-black text-gray-900">{globalRankings[0].user.name}</p>
                          <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">Vua Đấu Trường • Lv.{globalRankings[0].user.level}</p>
                       </div>
                       <div className="text-4xl font-black text-primary">{globalRankings[0].totalPoints.toLocaleString()} pts</div>
                    </div>
                  )}
                  {globalRankings[2] && (
                    <div className="order-3 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-4 relative overflow-hidden group hover:scale-105 transition-all">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600 opacity-10 rounded-bl-[4rem]" />
                       <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center text-3xl font-black text-amber-600 border-4 border-white shadow-lg">
                             {globalRankings[2].user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-600 rounded-xl shadow-md flex items-center justify-center text-white font-black border-2 border-white">3</div>
                       </div>
                       <div>
                          <p className="text-xl font-black text-gray-900">{globalRankings[2].user.name}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Level {globalRankings[2].user.level}</p>
                       </div>
                       <div className="text-3xl font-black text-amber-600">{globalRankings[2].totalPoints.toLocaleString()} pts</div>
                    </div>
                  )}
               </div>
             )}

             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thứ hạng</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Đấu thủ</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Cuộc thi đã tham gia</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Tổng điểm tích lũy</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {rankingLoading ? (
                           [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20" />)
                         ) : globalRankings.map((ranking, idx) => (
                           <tr key={ranking._id} className={`group hover:bg-gray-50/50 transition-colors ${ranking.user._id === user?.id ? 'bg-primary/5' : ''}`}>
                              <td className="px-8 py-6">
                                 <span className="text-lg font-black text-gray-400">#{idx + 1}</span>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl chinese-gradient flex items-center justify-center text-white font-black">
                                       {ranking.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-gray-900">{ranking.user.name}</p>
                                       <p className="text-[10px] font-bold text-gray-400 italic">Level {ranking.user.level} {ranking.user._id === user?.id && '• Bạn'}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center font-bold text-gray-600">{ranking.competitionsParticipated}</td>
                              <td className="px-8 py-6 text-right font-black text-primary text-lg">{ranking.totalPoints.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab !== 'ranking' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500 space-y-8">
             <div className="flex flex-wrap gap-2 pb-4">
                <Button
                  variant={selectedLevel === null ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel(null)}
                  className={`rounded-xl font-bold h-10 ${selectedLevel === null ? 'bg-gray-900 text-white' : 'text-gray-400'}`}
                >
                  Tất cả trình độ
                </Button>
                {levels.map((lvl) => (
                  <Button
                    key={lvl._id}
                    variant={selectedLevel === lvl.number ? 'default' : 'outline'}
                    onClick={() => setSelectedLevel(lvl.number)}
                    className={`rounded-xl font-bold h-10 transition-all ${
                      selectedLevel === lvl.number 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'text-gray-400 hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    Hán ngữ {lvl.number}
                  </Button>
                ))}
             </div>

             {loading ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Đang triệu tập đấu thủ...</p>
               </div>
             ) : competitions.length === 0 ? (
               <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                     <Sword className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-gray-900">Chiến trường đang im lặng</h3>
                     <p className="text-gray-500 font-medium">Chưa có cuộc thi nào phù hợp với bộ lọc hiện tại.</p>
                  </div>
               </div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {competitions.map((comp) => {
                    const isCreator = comp.creator._id === user?.id
                    const isParticipant = comp.participants.some(p => p._id === user?.id)
                    const hasPendingRequest = comp.pendingRequests?.some(r => r === user?.id)
                    
                    return (
                      <div 
                        key={comp._id}
                        onClick={() => navigate(`/user-competitions/${comp._id}`)}
                        className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-5 rounded-bl-[4rem]" />
                         
                         <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="space-y-1">
                                  <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{comp.title}</h3>
                                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                                     <Users className="w-3 h-3" />
                                     <span>{comp.creator.name}</span>
                                     {isCreator && <Badge className="bg-primary/10 text-primary border-none h-4 px-1.5 text-[8px] font-black uppercase">Chủ phòng</Badge>}
                                  </div>
                               </div>
                               <div className="scale-90 transform origin-right">
                                  {getStatusBadge(comp)}
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Trình độ</p>
                                  <p className="text-xs font-black text-gray-700">{getLevelName(comp.level)}</p>
                               </div>
                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                  <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Đang đấu</p>
                                  <p className="text-xs font-black text-gray-700">{comp.participants.length} Người</p>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <div className="flex items-center text-xs font-bold text-gray-500">
                                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                                  <span>{getTimeStatus(comp)}</span>
                               </div>
                               <div className="flex items-center text-xs font-bold text-gray-500">
                                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                                  <span>{comp.numberOfQuestions} Câu hỏi • {comp.totalTime} Phút</span>
                               </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                               {isParticipant ? (
                                 <span className="text-[10px] font-black uppercase text-green-600 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Bạn đã tham gia
                                 </span>
                               ) : hasPendingRequest ? (
                                 <span className="text-[10px] font-black uppercase text-amber-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Chờ xét duyệt
                                 </span>
                               ) : (
                                 <span className="text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                    Gửi yêu cầu tham gia <ArrowRight className="w-3 h-3 ml-1" />
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                    )
                  })}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}