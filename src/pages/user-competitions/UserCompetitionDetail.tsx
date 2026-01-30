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
  ArrowUpDown,
  Diamond,
  Gem
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
  cost: number
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/user-competitions')}
            className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
          
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
             <div className="px-4 py-1.5 border-r border-gray-100 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isPending ? 'Sắp khai cuộc' : isActive ? 'Đang tranh tài' : 'Trận đấu kết thúc'}</span>
             </div>
             <div className="px-4 py-1.5">
                <span className="text-sm font-black text-primary font-mono">{countdown}</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[4rem]" />
           
           <div className="relative z-10 space-y-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                 <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                       Đấu trường Hán ngữ • Cấp {competition.level}
                    </Badge>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{competition.title}</h1>
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-xl chinese-gradient flex items-center justify-center text-white font-black shadow-lg">
                          {competition.creator.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Được khởi tạo bởi</p>
                          <p className="text-sm font-bold text-gray-700">{competition.creator.name}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-3">
                    {canJoin && (
                      <Button onClick={handleJoinRequest} className="h-12 px-8 chinese-gradient text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all">
                        <UserPlus className="w-4 h-4 mr-2" /> Tham chiến ngay
                      </Button>
                    )}
                    {hasPendingRequest && (
                      <Button disabled className="h-12 px-8 bg-amber-50 text-amber-600 rounded-xl font-black border-2 border-amber-100">
                        <Clock className="w-4 h-4 mr-2" /> Đang chờ duyệt
                      </Button>
                    )}
                    {isParticipant && canStart && (
                      <Button onClick={handleStartCompetition} className="h-12 px-8 chinese-gradient text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all">
                        <Play className="w-4 h-4 mr-2" /> Vào thi ngay
                      </Button>
                    )}
                    {isCompleted && (
                      <Button onClick={handleViewResults} variant="outline" className="h-12 px-8 rounded-xl font-black border-2 border-gray-100 hover:border-primary hover:text-primary transition-all">
                        <Trophy className="w-4 h-4 mr-2" /> Xem bảng kết quả
                      </Button>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-gray-50">
                 {[
                   { icon: Trophy, label: 'Câu hỏi', value: `${competition.numberOfQuestions} câu`, color: 'text-yellow-600' },
                   { icon: Clock, label: 'Thời gian', value: `${competition.totalTime} phút`, color: 'text-blue-600' },
                   { icon: Users, label: 'Đấu thủ', value: `${competition.participants.length} người`, color: 'text-green-600' },
                   { icon: Diamond, label: 'Lệ phí', value: `${(competition.cost || 10000).toLocaleString()} Xu`, color: 'text-amber-500' }
                 ].map((item, i) => (
                   <div key={i} className="text-center space-y-1">
                      <div className={`w-10 h-10 rounded-xl ${item.color} bg-current/10 flex items-center justify-center mx-auto mb-2`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                      <p className="text-sm font-black text-gray-900">{item.value}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-primary" />
                    Danh sách đấu thủ ({competition.participants.length})
                 </h2>
                 <Button variant="ghost" size="sm" onClick={handleSort} className="rounded-xl font-bold text-gray-400 text-xs uppercase">
                    <ArrowUpDown className="w-3 h-3 mr-2" /> {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                 </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-4">
                 {competition.participants.length === 0 ? (
                   <div className="text-center py-12 text-gray-400 italic">Chưa có ai tham gia.</div>
                 ) : (
                   <div className="grid sm:grid-cols-2 gap-4">
                      {sortedParticipants.map((p) => (
                        <div key={p._id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                           <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-white">
                                 <AvatarFallback className="bg-gray-200 text-gray-500 font-bold text-xs">{p.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <p className="text-sm font-bold text-gray-900 leading-none mb-1">{p.name}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Level {p.level}</p>
                              </div>
                           </div>
                           {p._id === competition.creator._id && <Crown className="w-4 h-4 text-yellow-500" />}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>

           {isCreator && (
             <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                   <UserPlus className="w-6 h-6 mr-2 text-primary" />
                   Xét duyệt ({requests.length})
                </h2>
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-4">
                   {requests.length === 0 ? (
                     <div className="text-center py-8">
                        <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Không có yêu cầu mới</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {requests.map((r) => (
                          <div key={r._id} className="p-4 rounded-2xl border border-gray-100 space-y-4 bg-gray-50/30">
                             <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{r.requester.name[0]}</div>
                                <div className="min-w-0">
                                   <p className="text-xs font-black text-gray-900 truncate">{r.requester.name}</p>
                                   <p className="text-[9px] font-bold text-gray-400">HSK {r.requester.level}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <Button size="sm" onClick={() => openConfirmDialog('approve', r)} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg h-8">
                                   <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openConfirmDialog('reject', r)} className="flex-1 border-red-100 text-red-500 hover:bg-red-50 rounded-lg h-8">
                                   <X className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Confirmation Dialog Redesign */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${confirmDialog.type === 'approve' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
             {confirmDialog.type === 'approve' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
          </div>
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Xác nhận thao tác</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500 leading-relaxed">
               {confirmDialog.type === 'approve' ? 'Chấp nhận' : 'Từ chối'} quyền tham gia đấu trường của học viên <span className="text-gray-900 font-bold">{confirmDialog.request?.requester.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={handleConfirmAction}
              disabled={processingRequest !== null}
              className={`h-12 rounded-xl font-black text-white shadow-lg ${confirmDialog.type === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {processingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận ngay'}
            </Button>
            <Button variant="ghost" onClick={closeConfirmDialog} className="h-12 rounded-xl font-bold text-gray-400">Quay lại</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}