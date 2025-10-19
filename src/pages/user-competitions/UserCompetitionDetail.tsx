import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Trophy, 
  Clock, 
  Users, 
  Calendar,
  ArrowLeft,
  Loader2,
  UserPlus,
  Crown,
  GraduationCap,
  Check,
  X,
  Play,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react'

interface Competition {
  _id: string
  title: string
  creator: {
    _id: string
    name: string
    level: number
    email: string
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
  pendingRequests: any[]
  status: 'pending' | 'active' | 'completed'
  isStarted: boolean
  level: number
}

interface JoinRequest {
  _id: string
  requester: {
    _id: string
    name: string
    level: number
    email: string
  }
  requestedAt: string
  status: string
}

interface CompetitionDetailResponse {
  competition: Competition
  isCreator: boolean
  isParticipant: boolean
  hasPendingRequest: boolean
  canJoin: boolean
}

export const UserCompetitionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CompetitionDetailResponse | null>(null)
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'approve' | 'reject' | null
    request: JoinRequest | null
  }>({
    isOpen: false,
    type: null,
    request: null
  })

  useEffect(() => {
    if (id) {
      fetchCompetitionDetail()
      
      // Auto refresh every 30 seconds to update status
      const interval = setInterval(() => {
        fetchCompetitionDetail()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [id])

  useEffect(() => {
    if (data?.competition) {
      const timer = setInterval(() => {
        updateCountdown()
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [data])

  const fetchCompetitionDetail = async () => {
    try {
      const response = await api.get(`/user-competitions/${id}`)
      setData(response.data)
      
      if (response.data.isCreator) {
        fetchPendingRequests()
      }
    } catch (error) {
      toast.error('Không thể tải thông tin cuộc thi')
      navigate('/user-competitions')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get(`/user-competitions/${id}/requests`)
      setRequests(response.data.requests)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const updateCountdown = () => {
    if (!data?.competition) return

    const now = new Date()
    // Parse dates as UTC and convert to local timezone
    const start = new Date(data.competition.startTime)
    const end = new Date(data.competition.endTime)

    if (now < start) {
      const diff = start.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setCountdown(`Bắt đầu sau ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setCountdown(`Bắt đầu sau ${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    } else if (now < end && data.competition.isStarted) {
      const diff = end.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setCountdown(`Kết thúc sau ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setCountdown(`Kết thúc sau ${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    } else {
      setCountdown('Đã kết thúc')
    }
  }

  const handleJoinRequest = async () => {
    try {
      await api.post(`/user-competitions/${id}/request-join`)
      toast.success('Đã gửi yêu cầu tham gia!')
      fetchCompetitionDetail()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }


  const handleStartCompetition = () => {
    navigate(`/user-competitions/${id}/play`)
  }

  const handleViewResults = () => {
    navigate(`/user-competitions/${id}/stats`)
  }

  const openConfirmDialog = (type: 'approve' | 'reject', request: JoinRequest) => {
    setConfirmDialog({
      isOpen: true,
      type,
      request
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      request: null
    })
  }

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.request || !confirmDialog.type) return

    setProcessingRequest(confirmDialog.request._id)
    try {
      if (confirmDialog.type === 'approve') {
        await api.put(`/user-competitions/${id}/requests/${confirmDialog.request._id}/approve`)
        toast.success(`Đã chấp nhận yêu cầu của ${confirmDialog.request.requester.name}`)
      } else {
        await api.put(`/user-competitions/${id}/requests/${confirmDialog.request._id}/reject`)
        toast.success(`Đã từ chối yêu cầu của ${confirmDialog.request.requester.name}`)
      }
      
      // Refresh data
      await fetchCompetitionDetail()
      closeConfirmDialog()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setProcessingRequest(null)
    }
  }

  // Sort participants by name
  const sortedParticipants = data?.competition.participants.sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.name.localeCompare(b.name)
    } else {
      return b.name.localeCompare(a.name)
    }
  }) || []

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

  const { competition, isCreator, isParticipant, hasPendingRequest, canJoin } = data
  
  // Calculate real-time status
  const now = new Date()
  const start = new Date(competition.startTime)
  const end = new Date(competition.endTime)
  const isPending = now < start
  const isActive = now >= start && now < end
  const isCompleted = now >= end
  
  const canStart = isParticipant && isActive && !competition.isStarted

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/user-competitions')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{competition.title}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>Người tạo: {competition.creator.name}</span>
                  {isCreator && <Badge variant="secondary">Của bạn</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Cấp độ: HSK {competition.level}</span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              {isPending && (
                <Badge className="bg-yellow-500 text-white">Chờ bắt đầu</Badge>
              )}
              {isActive && (
                <Badge className="bg-green-500 text-white">Đang diễn ra</Badge>
              )}
              {isCompleted && (
                <Badge className="bg-gray-500 text-white">Đã kết thúc</Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">{countdown}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{competition.numberOfQuestions}</p>
              <p className="text-sm text-muted-foreground">Câu hỏi</p>
            </div>
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{competition.totalTime}</p>
              <p className="text-sm text-muted-foreground">Phút</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{competition.participants.length}</p>
              <p className="text-sm text-muted-foreground">Người tham gia</p>
            </div>
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {new Date(competition.startTime).toLocaleDateString('vi-VN', { 
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(competition.startTime).toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
                })}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {canJoin && (
              <Button onClick={handleJoinRequest} className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" />
                Xin tham gia
              </Button>
            )}
            {hasPendingRequest && (
              <Button disabled variant="secondary" className="flex-1">
                <Clock className="w-4 h-4 mr-2" />
                Đang chờ duyệt
              </Button>
            )}
            {isParticipant && canStart && (
              <Button onClick={handleStartCompetition} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Bắt đầu thi
              </Button>
            )}
            {isCompleted && (
              <Button onClick={handleViewResults} variant="outline" className="flex-1">
                <Trophy className="w-4 h-4 mr-2" />
                Xem kết quả
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Người tham gia ({competition.participants.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSort}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sắp xếp {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {competition.participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chưa có người tham gia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedParticipants.map((participant) => (
                <div key={participant._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-sm text-muted-foreground">HSK {participant.level}</p>
                    </div>
                  </div>
                  {participant._id === competition.creator._id && (
                    <Badge variant="secondary">
                      <Crown className="w-3 h-3 mr-1" />
                      Người tạo
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Requests Section - Only for creators */}
      {isCreator && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Yêu cầu tham gia ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Chưa có yêu cầu tham gia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{request.requester.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.requester.name}</p>
                        <p className="text-sm text-muted-foreground">
                          HSK {request.requester.level} • {new Date(request.requestedAt).toLocaleString('vi-VN', {
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => openConfirmDialog('approve', request)}
                        disabled={processingRequest === request._id}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => openConfirmDialog('reject', request)}
                        disabled={processingRequest === request._id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Xác nhận hành động
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'approve' ? (
                <>
                  Bạn có chắc chắn muốn <strong>chấp nhận</strong> yêu cầu tham gia của{' '}
                  <strong>{confirmDialog.request?.requester.name}</strong> không?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn <strong>từ chối</strong> yêu cầu tham gia của{' '}
                  <strong>{confirmDialog.request?.requester.name}</strong> không?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeConfirmDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processingRequest === confirmDialog.request?._id}
              className={
                confirmDialog.type === 'approve'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }
            >
              {processingRequest === confirmDialog.request?._id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : confirmDialog.type === 'approve' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {confirmDialog.type === 'approve' ? 'Chấp nhận' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
