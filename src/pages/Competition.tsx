import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
// Avatar imports not used on list page; used in detail page instead
import { 
  Trophy, 
  Clock, 
  Users, 
  Star, 
  Target, 
  Calendar,
  Gem,
  TrendingUp,
  Loader2
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

// LeaderboardEntry is defined/used in detail page

export const Competition = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  // leaderboard is shown in detail page
  const [loading, setLoading] = useState(true)
  // details moved to separate page

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

  // leaderboard fetching moved to detail page

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

  // Rank icon used in detail page only

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
                      {getStatusBadge(competition)}
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
                          <span>
                            {Array.isArray(competition.participants) ? competition.participants.length : competition.participants} người tham gia
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span>Cấp độ: {typeof competition.level === 'string' ? competition.level : (competition.level?.name || 'Unknown')}</span>
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
                        disabled={getComputedStatus(competition) !== 'active'}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        {getComputedStatus(competition) === 'active' ? 'Tham gia' : 'Chưa mở'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/competition/${competition._id}`)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* Sidebar stats */}
          <div className="space-y-6">
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
                    {competitions.filter(c => getComputedStatus(c) === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sắp diễn ra</span>
                  <span className="font-semibold text-blue-600">
                    {competitions.filter(c => getComputedStatus(c) === 'upcoming').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Details moved to separate page */}
      </div>
    </div>
  )
}