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
  GraduationCap
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
}

export const UserCompetitionList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<UserCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchCompetitions()
    
    // Auto refresh every 30 seconds to update status
    const interval = setInterval(() => {
      fetchCompetitions()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeTab])

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
      if (activeTab !== 'all' && activeTab !== 'my') {
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
      
      setCompetitions(competitions)
    } catch (error) {
      toast.error('Không thể tải danh sách cuộc thi')
    } finally {
      setLoading(false)
    }
  }

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
        minute: '2-digit'
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
            <TabsTrigger 
              value="all" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Tất cả
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Chờ bắt đầu
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Đang diễn ra
            </TabsTrigger>
            <TabsTrigger 
              value="my"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Cuộc thi của tôi
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
              <p className="text-gray-600 mb-6">Hãy tạo cuộc thi đầu tiên để bắt đầu thi đấu với bạn bè!</p>
              <Button 
                onClick={() => navigate('/user-competitions/create')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
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
                        <p className="font-semibold text-gray-800">HSK {competition.creator.level}</p>
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
      </div>
    </div>
  )
}
