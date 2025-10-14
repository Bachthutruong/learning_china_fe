import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Target,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Star,
  BarChart3,
  PieChart,
  Loader2,
  Calendar,
  Timer,
} from 'lucide-react'

interface Competition {
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
  participants: Array<{
    _id: string
    name: string
    level: number
  }>
  status: 'pending' | 'active' | 'completed'
  level: number
}

interface CompetitionResult {
  _id: string
  user: {
    _id: string
    name: string
    level: number
  }
  score: number
  correctAnswers: number
  totalQuestions: number
  timeTaken: number
  rank: number
  answers: Array<{
    questionId: string
    userAnswer: number | number[] | null
    isCorrect: boolean
    timeSpent: number
  }>
  createdAt: string
}

interface CompetitionStats {
  totalParticipants: number
  averageScore: number
  averageTime: number
  completionRate: number
  scoreDistribution: {
    excellent: number // 90-100%
    good: number // 70-89%
    average: number // 50-69%
    poor: number // 0-49%
  }
  timeDistribution: {
    fast: number // < 50% of total time
    normal: number // 50-80% of total time
    slow: number // > 80% of total time
  }
}

export const UserCompetitionStats = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [results, setResults] = useState<CompetitionResult[]>([])
  const [stats, setStats] = useState<CompetitionStats | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchCompetitionData()
    }
  }, [id])

  const fetchCompetitionData = async () => {
    setLoading(true)
    try {
      const [competitionRes, resultsRes] = await Promise.all([
        api.get(`/user-competitions/${id}`),
        api.get(`/user-competitions/${id}/results`)
      ])

      setCompetition(competitionRes.data.competition)
      setResults(resultsRes.data.results || [])
      
      // Calculate stats
      const calculatedStats = calculateStats(resultsRes.data.results || [], competitionRes.data.competition)
      setStats(calculatedStats)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu cuộc thi')
      navigate('/user-competitions')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (results: CompetitionResult[], competition: Competition): CompetitionStats => {
    if (results.length === 0) {
      return {
        totalParticipants: 0,
        averageScore: 0,
        averageTime: 0,
        completionRate: 0,
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        timeDistribution: { fast: 0, normal: 0, slow: 0 }
      }
    }

    const totalParticipants = results.length
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalParticipants
    const averageTime = results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / totalParticipants
    const completionRate = (results.length / competition.participants.length) * 100

    // Score distribution
    const scoreDistribution = results.reduce((acc, r) => {
      const percentage = r.score // score is already a percentage
      if (percentage >= 90) acc.excellent++
      else if (percentage >= 70) acc.good++
      else if (percentage >= 50) acc.average++
      else acc.poor++
      return acc
    }, { excellent: 0, good: 0, average: 0, poor: 0 })

    // Time distribution
    const totalTimeSeconds = competition.totalTime * 60
    const timeDistribution = results.reduce((acc, r) => {
      const timeTaken = r.timeTaken || 0
      const percentage = totalTimeSeconds > 0 ? (timeTaken / totalTimeSeconds) * 100 : 0
      if (percentage < 50) acc.fast++
      else if (percentage <= 80) acc.normal++
      else acc.slow++
      return acc
    }, { fast: 0, normal: 0, slow: 0 })

    return {
      totalParticipants,
      averageScore,
      averageTime,
      completionRate,
      scoreDistribution,
      timeDistribution
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0:00'
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>
    }
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thống kê cuộc thi...</p>
        </div>
      </div>
    )
  }

  if (!competition || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-500 text-lg">Không tìm thấy dữ liệu cuộc thi</p>
          <Button onClick={() => navigate('/user-competitions')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/user-competitions')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thống Kê Cuộc Thi
              </h1>
              <p className="text-xl text-gray-600 mt-2">{competition.title}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-600">Người tạo: {competition.creator.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-600">
                    {new Date(competition.startTime).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-lg">
              <Trophy className="w-5 h-5 mr-2" />
              HSK {competition.level}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Bảng xếp hạng
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Phân tích
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tổng tham gia</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalParticipants}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Điểm trung bình</p>
                      <p className="text-3xl font-bold text-green-600">{stats.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Thời gian TB</p>
                      <p className="text-3xl font-bold text-orange-600">{formatTime(stats.averageTime)}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Timer className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competition Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    Thông tin cuộc thi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-600">Số câu hỏi</span>
                    <span className="font-semibold">{competition.numberOfQuestions} câu</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Thời gian</span>
                    <span className="font-semibold">{competition.totalTime} phút</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Cấp độ</span>
                    <span className="font-semibold">HSK {competition.level}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-600">Trạng thái</span>
                    <Badge className="bg-green-500 text-white">Đã kết thúc</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Top 3 thành tích
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.slice(0, 3).map((result) => (
                    <div key={result._id} className="flex items-center justify-between p-3 mb-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        {getRankIcon(result.rank)}
                        <div>
                          <p className="font-semibold text-gray-800">{result.user.name}</p>
                          <p className="text-sm text-gray-600">HSK {result.user.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${getScoreColor(result.score, result.totalQuestions)}`}>
                          {result.correctAnswers}/{result.totalQuestions}
                        </p>
                        <p className="text-sm text-gray-600">{formatTime(result.timeTaken)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Bảng xếp hạng
                </CardTitle>
                <CardDescription>
                  Danh sách tất cả người tham gia được sắp xếp theo điểm số
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Chưa có kết quả nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div
                        key={result._id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                          index < 3
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10">
                            {getRankIcon(result.rank)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{result.user.name}</p>
                            <p className="text-sm text-gray-600">HSK {result.user.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Điểm</p>
                            <p className={`font-bold text-xl ${getScoreColor(result.score, result.totalQuestions)}`}>
                              {result.correctAnswers}/{result.totalQuestions}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Thời gian</p>
                            <p className="font-semibold text-gray-800">{formatTime(result.timeTaken)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Tỷ lệ</p>
                            <p className={`font-semibold ${getScoreColor(result.score, result.totalQuestions)}`}>
                              {result.score.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Phân bố điểm số
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Xuất sắc (90-100%)</span>
                      </div>
                      <span className="font-semibold text-green-600">{stats.scoreDistribution.excellent}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">Tốt (70-89%)</span>
                      </div>
                      <span className="font-semibold text-blue-600">{stats.scoreDistribution.good}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-700">Trung bình (50-69%)</span>
                      </div>
                      <span className="font-semibold text-yellow-600">{stats.scoreDistribution.average}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700">Yếu (0-49%)</span>
                      </div>
                      <span className="font-semibold text-red-600">{stats.scoreDistribution.poor}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Distribution */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Phân bố thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Nhanh (&lt; 50% thời gian)</span>
                      </div>
                      <span className="font-semibold text-green-600">{stats.timeDistribution.fast}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">Bình thường (50-80%)</span>
                      </div>
                      <span className="font-semibold text-blue-600">{stats.timeDistribution.normal}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700">Chậm (&gt; 80% thời gian)</span>
                      </div>
                      <span className="font-semibold text-orange-600">{stats.timeDistribution.slow}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
