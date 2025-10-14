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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/user-competitions/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      {/* Competition Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{competition.title}</CardTitle>
          <CardDescription>
            Người tạo: {competition.creator.name} • 
            Kết thúc: {new Date(competition.endTime).toLocaleString('vi-VN')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* My Result (if participated) */}
      {myResult && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Kết quả của bạn</span>
              {getRankBadge(myResult.rank)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold">#{myResult.rank}</p>
                <p className="text-sm text-muted-foreground">Xếp hạng</p>
              </div>
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{myResult.score}%</p>
                <p className="text-sm text-muted-foreground">Điểm số</p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">
                  {myResult.correctAnswers}/{myResult.totalQuestions}
                </p>
                <p className="text-sm text-muted-foreground">Câu đúng</p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{formatTime(myResult.timeSpent)}</p>
                <p className="text-sm text-muted-foreground">Thời gian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng xếp hạng</CardTitle>
          <CardDescription>
            Tổng cộng {results.length} người tham gia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chưa có kết quả</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => {
                const isMe = result.user._id === user?.id
                return (
                  <div
                    key={result.user._id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isMe ? 'bg-primary/10 border border-primary' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10">
                        {getRankIcon(result.rank)}
                      </div>
                      <Avatar>
                        <AvatarFallback>{result.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {result.user.name}
                          {isMe && <Badge variant="secondary" className="ml-2">Bạn</Badge>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          HSK {result.user.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{result.score}%</p>
                      <p className="text-sm text-muted-foreground">
                        {result.correctAnswers}/{result.totalQuestions} câu • {formatTime(result.timeSpent)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
