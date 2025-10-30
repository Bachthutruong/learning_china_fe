import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Trophy, 
  Clock, 
  Users, 
  Calendar,
  Plus,
  Loader2,
  UserPlus,
  Crown,
  GraduationCap,
  Filter,
  Medal,
  Star,
  Award,
  TrendingUp
} from 'lucide-react'

interface UserCompetition {
  _id: string
  title: string
  creator: {
    _id: string
    name: string
    level: number
  }
  numberOfQuestions: number
  totalTime: number
  startTime: string
  endTime: string
  participants: any[]
  pendingRequests: any[]
  status: 'pending' | 'active' | 'completed'
  isStarted: boolean
  level: number // Level of competition at time of creation
}

interface Level {
  _id: string
  name: string
  number: number
  description: string
  requiredExperience: number
  color: string
  icon: string
}

interface GlobalRanking {
  _id: string
  user: {
    _id: string
    name: string
    level: number
    email: string
  }
  totalPoints: number
  competitionsParticipated: number
  rank?: number
}

export const UserCompetitionList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<UserCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [globalRankings, setGlobalRankings] = useState<GlobalRanking[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [scoringConfigs, setScoringConfigs] = useState<any[]>([])

  useEffect(() => {
    fetchLevels()
    if (activeTab === 'ranking') {
      fetchGlobalRanking()
      fetchScoringConfigs()
    } else {
      fetchCompetitions()
    }
    
    // Auto refresh every 30 seconds to update status
    const interval = setInterval(() => {
      if (activeTab === 'ranking') {
        fetchGlobalRanking()
      } else {
        fetchCompetitions()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeTab, selectedLevel])

  const fetchGlobalRanking = async () => {
    setRankingLoading(true)
    try {
      const response = await api.get('/competition-ranking/global-ranking', {
        params: { limit: 100, page: 1 }
      })
      setGlobalRankings(response.data.rankings || [])
    } catch (error) {
      console.error('Error fetching global ranking:', error)
      toast.error('Không thể tải bảng xếp hạng')
    } finally {
      setRankingLoading(false)
    }
  }

  const fetchScoringConfigs = async () => {
    try {
      const res = await api.get('/competition-ranking/scoring-configs-public')
      setScoringConfigs(res.data.configs || [])
    } catch (e) {
      // silent
    }
  }

  const fetchLevels = async () => {
    try {
      const response = await api.get('/admin/levels')
      setLevels(response.data)
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const fetchCompetitions = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab === 'my') {
        params.myCompetitions = true
      }
      // Don't filter by status on backend, we'll filter by real-time status on frontend
      
      const response = await api.get('/user-competitions', { params })
      let competitions = response.data.competitions
      
      // Filter by real-time status on frontend
      if (activeTab !== 'my') {
        const now = new Date()
        competitions = competitions.filter((competition: UserCompetition) => {
          const start = new Date(competition.startTime)
          const end = new Date(competition.endTime)
          
          switch (activeTab) {
            case 'pending':
              return now < start
            case 'active':
              return now >= start && now < end
            case 'completed':
              return now >= end
            default:
              return true
          }
        })
      }
      
      // Filter by level if selected
      if (selectedLevel !== null) {
        competitions = competitions.filter((competition: UserCompetition) => 
          competition.level === selectedLevel
        )
      }
      
      setCompetitions(competitions)
    } catch (error) {
      toast.error('Không thể tải danh sách cuộc thi')
    } finally {
      setLoading(false)
    }
  }

  // no derived counts in restored UI

  const getStatusBadge = (competition: UserCompetition) => {
    const now = new Date()
    const start = new Date(competition.startTime)
    const end = new Date(competition.endTime)

    if (now < start) {
      return <Badge className="bg-yellow-500 text-white">Chờ bắt đầu</Badge>
    } else if (now < end) {
      return <Badge className="bg-green-500 text-white">Đang diễn ra</Badge>
    } else {
      return <Badge className="bg-gray-500 text-white">Đã kết thúc</Badge>
    }
  }

  const getTimeStatus = (competition: UserCompetition) => {
    const now = new Date()
    const start = new Date(competition.startTime)
    const end = new Date(competition.endTime)

    const formatTime = (date: Date) => {
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    }

    if (now < start) {
      const diff = start.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 24) {
        return `Bắt đầu sau ${Math.floor(hours / 24)} ngày (${formatTime(start)})`
      } else if (hours > 0) {
        return `Bắt đầu sau ${hours} giờ ${minutes} phút (${formatTime(start)})`
      } else {
        return `Bắt đầu sau ${minutes} phút (${formatTime(start)})`
      }
    } else if (now < end) {
      const diff = end.getTime() - now.getTime()
      const minutes = Math.floor(diff / (1000 * 60))
      return `Đang diễn ra - Còn ${minutes} phút (Kết thúc: ${formatTime(end)})`
    } else {
      return `Đã kết thúc (${formatTime(end)})`
    }
  }

  const getLevelName = (levelNumber: number) => {
    const level = levels.find(l => l.number === levelNumber)
    return level ? level.name : `Cấp ${levelNumber}`
  }

  const handleJoinRequest = async (competitionId: string) => {
    try {
      await api.post(`/user-competitions/${competitionId}/request-join`)
      toast.success('Đã gửi yêu cầu tham gia!')
      fetchCompetitions()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Cuộc Thi Người Dùng
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Tạo và tham gia cuộc thi với bạn bè
            </p>
          </div>
          <Button 
            onClick={() => navigate('/user-competitions/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo cuộc thi
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
            <TabsTrigger 
              value="pending"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Chờ bắt đầu
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Đã kết thúc
            </TabsTrigger>
            <TabsTrigger 
              value="my"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Cuộc thi của bạn
            </TabsTrigger>
            <TabsTrigger 
              value="ranking"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Xếp hạng toàn bộ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Global Ranking Tab Content */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-3xl mb-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                        <Trophy className="w-7 h-7 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Bảng Xếp Hạng Toàn Bộ</span>
                </CardTitle>
                    <CardDescription className="text-base flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4" />
                  Tổng hợp điểm số và số cuộc thi tham gia từ tất cả các cuộc thi
                </CardDescription>
                    {scoringConfigs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {scoringConfigs.map((cfg, idx) => {
                          const from = cfg.effectiveFrom ? new Date(cfg.effectiveFrom) : null
                          const to = cfg.effectiveTo ? new Date(cfg.effectiveTo) : null
                          const format = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          const label = from && to ? `${format(from)} - ${format(to)}` : from ? `Từ ${format(from)}` : to ? `Đến ${format(to)}` : 'Luôn áp dụng'
                          return (
                            <span key={idx} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border">
                              {cfg.name}: {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rankingLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                    <p className="text-gray-600 text-lg">Đang tải bảng xếp hạng...</p>
                  </div>
                ) : globalRankings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có dữ liệu xếp hạng</h3>
                    <p className="text-gray-600">Hãy tham gia các cuộc thi để xuất hiện trên bảng xếp hạng!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {globalRankings.slice(0, 3).length > 0 && (
                      <div className="relative mb-12">
                        <div className="flex items-end justify-center gap-4 mb-8">
                          {globalRankings[1] && (
                            <div className="flex flex-col items-center flex-1 max-w-[200px]">
                              <div className="relative mb-4">
                                <div className={`w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white ${globalRankings[1].user._id === user?.id ? 'ring-4 ring-blue-400' : ''}`}>
                                  {globalRankings[1].user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-1.5 shadow-lg">
                                  <Medal className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="w-full bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-2xl shadow-xl p-4 text-center min-h-[120px] flex flex-col justify-end">
                                <p className="font-bold text-white text-lg mb-1">#{globalRankings[1].rank || 2}</p>
                                <p className="font-semibold text-gray-800 text-sm mb-1 truncate w-full">{globalRankings[1].user.name}</p>
                                <Badge variant="outline" className="bg-white/80 mb-2">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Cấp {globalRankings[1].user.level}
                                </Badge>
                                <p className="text-xs text-gray-700 font-medium">{globalRankings[1].totalPoints.toLocaleString()} điểm</p>
                                {globalRankings[1].user._id === user?.id && (
                                  <Badge className="bg-blue-500 text-white mt-2">Bạn</Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {globalRankings[0] && (
                            <div className="flex flex-col items-center flex-1 max-w-[200px]">
                              <div className="relative mb-4">
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl shadow-2xl border-4 border-white ${globalRankings[0].user._id === user?.id ? 'ring-4 ring-yellow-400' : ''}`}>
                                  {globalRankings[0].user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-lg">
                                  <Crown className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-2xl shadow-2xl p-4 text-center min-h-[150px] flex flex-col justify-end">
                                <p className="font-bold text-white text-xl mb-1">#{globalRankings[0].rank || 1}</p>
                                <p className="font-bold text-gray-800 text-base mb-1 truncate w-full">{globalRankings[0].user.name}</p>
                                <Badge variant="outline" className="bg-white/80 mb-2">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Cấp {globalRankings[0].user.level}
                                </Badge>
                                <p className="text-xs text-gray-800 font-bold">{globalRankings[0].totalPoints.toLocaleString()} điểm</p>
                                {globalRankings[0].user._id === user?.id && (
                                  <Badge className="bg-yellow-600 text-white mt-2">Bạn</Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {globalRankings[2] && (
                            <div className="flex flex-col items-center flex-1 max-w-[200px]">
                              <div className="relative mb-4">
                                <div className={`w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white ${globalRankings[2].user._id === user?.id ? 'ring-4 ring-orange-400' : ''}`}>
                                  {globalRankings[2].user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1.5 shadow-lg">
                                  <Medal className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="w-full bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-2xl shadow-xl p-4 text-center min-h-[100px] flex flex-col justify-end">
                                <p className="font-bold text-white text-lg mb-1">#{globalRankings[2].rank || 3}</p>
                                <p className="font-semibold text-gray-800 text-sm mb-1 truncate w-full">{globalRankings[2].user.name}</p>
                                <Badge variant="outline" className="bg-white/80 mb-2">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Cấp {globalRankings[2].user.level}
                                </Badge>
                                <p className="text-xs text-gray-700 font-medium">{globalRankings[2].totalPoints.toLocaleString()} điểm</p>
                                {globalRankings[2].user._id === user?.id && (
                                  <Badge className="bg-orange-600 text-white mt-2">Bạn</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {globalRankings.slice(3).length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5 text-purple-600" />
                          Các vị trí khác
                        </h3>
                        {globalRankings.slice(3).map((ranking, index) => {
                          const isCurrentUser = ranking.user._id === user?.id
                          const actualRank = ranking.rank || index + 4
                          return (
                            <Card
                              key={ranking._id} 
                              className={`transition-all duration-300 hover:shadow-lg border-2 ${
                                isCurrentUser
                                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md'
                                  : 'bg-white/90 border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                      isCurrentUser
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                                    }`}>
                                      #{actualRank}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className={`w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md ${
                                      isCurrentUser ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                                    }`}>
                                    {ranking.user.name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-lg text-gray-800 truncate">{ranking.user.name}</h4>
                                      {isCurrentUser && (<Badge className="bg-blue-500 text-white">Bạn</Badge>)}
                                </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge variant="outline" className="bg-white">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  Cấp {ranking.user.level}
                                </Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6 flex-shrink-0">
                                    <div className="text-center">
                                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                                        <Trophy className="w-4 h-4" />
                                        <span className="text-xs font-medium">Cuộc thi</span>
                                      </div>
                                      <p className="font-bold text-lg text-gray-800">{ranking.competitionsParticipated}</p>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                                        <Award className="w-4 h-4" />
                                        <span className="text-xs font-medium">Tổng điểm</span>
                                      </div>
                                      <p className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">{ranking.totalPoints.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Level Filter Section - Only show for competition tabs */}
        {activeTab !== 'ranking' && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Theo cấp độ</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedLevel === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(null)}
              className={selectedLevel === null 
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            >
              Tất cả cấp độ
            </Button>
            {levels.map((level) => (
              <Button
                key={level._id}
                variant={selectedLevel === level.number ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level.number)}
                className={selectedLevel === level.number 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }
                style={selectedLevel === level.number ? {} : { borderColor: level.color }}
              >
                {level.name}
              </Button>
            ))}
          </div>
        </div>
        )}

        {/* Only show competitions list when NOT in ranking tab */}
        {activeTab !== 'ranking' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Đang tải danh sách cuộc thi...</p>
                </div>
              </div>
            ) : competitions.length === 0 ? (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có cuộc thi nào</h3>
                 或者 <p className="text-gray-600 mb-6">Hãy tạo cuộc thi đầu tiên để bắt đầu thi đấu với bạn bè!</p>
                  <Button 
                    onClick={() => navigate('/user-competitions/create')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w mv-5 h-5 mr-2" />
                    Tạo cuộc thi đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => {
            const isCreator = competition.creator._id === user?.id
            const isParticipant = competition.participants.some(p => p._id === user?.id)
            const hasPendingRequest = competition.pendingRequests.some(r => r === user?.id)
            
            // Calculate real-time status
            const now = new Date()
            const start = new Date(competition.startTime)
            const end = new Date(competition.endTime)
            const isPending = now < start
            const isActive = now >= start && now < end
            
            const canJoin = !isCreator && !isParticipant && !hasPendingRequest && (isPending || isActive)

            return (
              <Card 
                key={competition._id} 
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
                onClick={() => navigate(`/user-competitions/${competition._id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-bold text-gray-800">{competition.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">{competition.creator.name}</span>
                        {isCreator && <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Của bạn</Badge>}
                      </CardDescription>
                    </div>
                    {getStatusBadge(competition)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Cấp độ</p>
                        <p className="font-semibold text-gray-800">{getLevelName(competition.level)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tham gia</p>
                        <p className="font-semibold text-gray-800">{competition.participants.length} người</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Câu hỏi</p>
                        <p className="font-semibold text-gray-800">{competition.numberOfQuestions} câu</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Thời gian</p>
                        <p className="font-semibold text-gray-800">{competition.totalTime} phút</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">{getTimeStatus(competition)}</span>
                  </div>

                  {isParticipant && !isCreator && (
                    <div className="w-full p-3 bg-green-100 border border-green-200 rounded-lg text-center">
                      <Badge className="bg-green-500 text-white">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Đã tham gia
                      </Badge>
                    </div>
                  )}

                  {hasPendingRequest && (
                    <div className="w-full p-3 bg-yellow-100 border border-yellow-200 rounded-lg text-center">
                      <Badge className="bg-yellow-500 text-white">
                        Đang chờ duyệt
                      </Badge>
                    </div>
                  )}

                  {canJoin && (
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJoinRequest(competition._id)
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Xin tham gia
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
              })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
