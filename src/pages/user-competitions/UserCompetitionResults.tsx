import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Trophy, 
  Clock, 
  Medal,
  Target,
  Award,
  ArrowLeft,
  Loader2,
  Crown
} from 'lucide-react'

interface Result {
  rank: number
  user: {
    _id: string
    name: string
    level: number
  }
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
  completedAt: string
}

interface Competition {
  id: string
  title: string
  creator: {
    _id: string
    name: string
  }
  status: string
  startTime: string
  endTime: string
  totalParticipants: number
}

interface ResultsData {
  competition: Competition
  results: Result[]
}

export const UserCompetitionResults = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ResultsData | null>(null)
  const [myResult, setMyResult] = useState<Result | null>(null)

  useEffect(() => {
    if (id) {
      fetchResults()
    }
  }, [id])

  const fetchResults = async () => {
    try {
      const response = await api.get(`/user-competitions/${id}/results`)
      setData(response.data)
      
      // Find current user's result
      const userResult = response.data.results.find(
        (r: Result) => r.user._id === user?.id
      )
      setMyResult(userResult || null)
    } catch (error) {
      toast.error('Không thể tải kết quả')
      navigate('/user-competitions')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />
      default:
        return <span className="w-5 h-5 text-center font-bold">{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">Quán quân</Badge>
      case 2:
        return <Badge className="bg-gray-400">Á quân</Badge>
      case 3:
        return <Badge className="bg-orange-600">Hạng ba</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { competition, results } = data

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/user-competitions/${id}`)}
            className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại thông tin
          </Button>
          
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-xl px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
             Kết thúc trận đấu
          </Badge>
        </div>

        {/* Competition Title Header */}
        <div className="text-center space-y-4">
           <h1 className="text-4xl font-black text-gray-900 tracking-tight">{competition.title}</h1>
           <div className="flex items-center justify-center space-x-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Người tạo: {competition.creator.name}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{new Date(competition.endTime).toLocaleDateString('vi-VN')}</span>
           </div>
        </div>

        {/* My Highlight Result */}
        {myResult && (
          <div className="bg-white rounded-[3rem] p-10 border-2 border-primary shadow-2xl shadow-primary/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-10 rounded-bl-[8rem]" />
             
             <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 chinese-gradient rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
                      <Trophy className="w-12 h-12 text-white" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black border-4 border-white shadow-lg">
                      {myResult.rank}
                   </div>
                </div>

                <div>
                   <h2 className="text-3xl font-black text-gray-900 mb-1">Thành tích của bạn</h2>
                   <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">
                      {myResult.rank === 1 ? 'Quán quân Đấu trường' : myResult.rank <= 3 ? 'Top cao thủ' : 'Chiến binh nỗ lực'}
                   </p>
                </div>

                <div className="grid grid-cols-3 gap-8 w-full max-w-lg pt-8 border-t border-gray-100">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400">Độ chính xác</p>
                      <p className="text-2xl font-black text-gray-900">{myResult.score}%</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400">Câu đúng</p>
                      <p className="text-2xl font-black text-green-600">{myResult.correctAnswers}/{myResult.totalQuestions}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400">Thời gian</p>
                      <p className="text-2xl font-black text-blue-600">{formatTime(myResult.timeSpent)}</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Global Leaderboard for this competition */}
        <div className="space-y-6">
           <h3 className="text-2xl font-black text-gray-900 flex items-center">
              <Medal className="w-6 h-6 mr-2 text-primary" />
              Bảng xếp hạng chung cuộc
           </h3>

           <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
              <div className="p-4 md:p-8 space-y-3">
                 {results.length === 0 ? (
                   <div className="text-center py-12 text-gray-400 italic">Chưa có kết quả.</div>
                 ) : (
                   results.map((r) => {
                     const isMe = r.user._id === user?.id
                     return (
                       <div key={r.user._id} className={`flex items-center p-5 rounded-2xl border transition-all ${
                         isMe ? 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/5' : 'bg-gray-50/50 border-gray-100'
                       }`}>
                          <div className="w-12 flex justify-center shrink-0">
                             {getRankIcon(r.rank)}
                          </div>
                          <Avatar className="h-12 w-12 rounded-xl shadow-sm border border-white">
                             <AvatarFallback className="bg-gray-200 text-gray-500 font-black">{r.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="ml-6 flex-1 min-w-0">
                             <div className="flex items-center space-x-2 mb-1">
                                <p className="font-black text-gray-900 truncate">{r.user.name}</p>
                                {isMe && <Badge className="bg-primary text-[8px] font-black uppercase h-4 px-1.5 border-none">Bạn</Badge>}
                             </div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level {r.user.level} • {formatTime(r.timeSpent)}</p>
                          </div>
                          <div className="text-right">
                             <p className={`text-lg font-black ${isMe ? 'text-primary' : 'text-gray-900'}`}>{r.score}%</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase">{r.correctAnswers} Correct</p>
                          </div>
                       </div>
                     )
                   })
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}