import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Trophy, Calendar, Clock, Users, Target, Gem, Star, TrendingUp, Crown, Medal, Loader2, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {competition.title}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{competition.description}</p>
        </div>

        <Card className="mb-6 border-0 shadow-xl bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Chi tiết cuộc thi
            </CardTitle>
            <CardDescription>Thời gian, thể lệ và phần thưởng</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Bắt đầu: {new Date(competition.startDate).toLocaleString()}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Kết thúc: {new Date(competition.endDate).toLocaleString()}</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4" />{Array.isArray(competition.participants) ? competition.participants.length : competition.participants} người tham gia</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" />Cấp độ: {typeof competition.level === 'string' ? competition.level : (competition.level?.name || 'Unknown')}</div>
              <div className="flex items-center gap-2"><Gem className="h-4 w-4 text-blue-500" />Phí tham gia: {competition.cost} xu</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" />Thưởng: +{competition.reward.xp} XP, +{competition.reward.coins} xu</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Bảng xếp hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Chưa có dữ liệu xếp hạng</div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 20).map((player, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-white to-purple-50 border">
                    <div className="flex items-center justify-center w-8 h-8">{getRankIcon(player.rank)}</div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{(player.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.score} điểm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button onClick={joinCompetition} disabled={status !== 'active'} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {status === 'active' ? 'Tham gia cuộc thi' : 'Chưa mở'}
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
