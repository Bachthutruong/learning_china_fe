import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { 
  Trophy, 
  Clock, 
  Users, 
  Star, 
  Target, 
  Calendar,
  Gem,
  TrendingUp,
  Crown,
  Medal,
  Loader2
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Competition {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  participants: number
  cost: number
  reward: { xp: number; coins: number }
  status: 'active' | 'upcoming' | 'ended'
  level: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  avatar?: string
}

export const Competition = () => {
  const { user } = useAuth()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  // Removed unused state: selectedCompetition, competitionStats

  useEffect(() => {
    fetchCompetitions()
    fetchLeaderboard()
    // Removed unused fetchCompetitionStats
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

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/competitions/leaderboard')
      setLeaderboard(response.data.leaderboard || [])
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  // Removed unused fetchCompetitionStats function

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

  const getStatusBadge = (status: string) => {
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Medal className="h-5 w-5 text-amber-600" />
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cuộc thi ngôn ngữ</h1>
          <p className="text-gray-600">Tham gia các cuộc thi để thử thách bản thân và giành giải thưởng</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Competitions */}
          <div className="lg:col-span-2 space-y-6">
            {competitions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">Chưa có cuộc thi nào</h3>
                  <p className="text-gray-400">Các cuộc thi mới sẽ được thông báo sớm.</p>
                </CardContent>
              </Card>
            ) : (
              competitions.map((competition) => (
                <Card key={competition._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          {competition.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {competition.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(competition.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Bắt đầu: {new Date(competition.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Kết thúc: {new Date(competition.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{competition.participants} người tham gia</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span>Cấp độ: {competition.level}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Gem className="h-4 w-4 text-blue-500" />
                          <span>Phí tham gia: {competition.cost} xu</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>Thưởng: +{competition.reward.xp} XP, +{competition.reward.coins} xu</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => joinCompetition(competition._id, competition.cost)}
                        disabled={competition.status !== 'active' || (!!user && user.coins < competition.cost)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        {competition.status === 'active' ? 'Tham gia' : 'Chưa mở'}
                      </Button>
                      <Button variant="outline">
                        Chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Leaderboard */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Bảng xếp hạng
                </CardTitle>
                <CardDescription>Top người chơi xuất sắc nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chưa có dữ liệu xếp hạng</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((player, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
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

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Thống kê
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cuộc thi</span>
                  <span className="font-semibold">{competitions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đang diễn ra</span>
                  <span className="font-semibold text-green-600">
                    {competitions.filter(c => c.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sắp diễn ra</span>
                  <span className="font-semibold text-blue-600">
                    {competitions.filter(c => c.status === 'upcoming').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}