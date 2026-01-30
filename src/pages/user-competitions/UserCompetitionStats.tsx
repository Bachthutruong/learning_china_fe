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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user-competitions')}
              className="rounded-xl font-bold text-gray-500 hover:text-primary -ml-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Phân tích <span className="text-primary">Đấu trường</span></h1>
            <p className="text-xl font-bold text-gray-500">{competition.title}</p>
            
            <div className="flex flex-wrap gap-4 pt-2">
               <div className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Chủ phòng: {competition.creator.name}</span>
               </div>
               <div className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{new Date(competition.startTime).toLocaleDateString('vi-VN')}</span>
               </div>
            </div>
          </div>
          
          <div className="chinese-gradient p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 text-center min-w-[160px] transform hover:rotate-3 transition-transform">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Trình độ</p>
             <p className="text-3xl font-black">HSK {competition.level}</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Tổng đấu thủ', val: stats.totalParticipants, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Điểm trung bình', val: `${stats.averageScore.toFixed(1)}%`, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
             { label: 'Thời gian TB', val: formatTime(stats.averageTime), icon: Timer, color: 'text-orange-600', bg: 'bg-orange-50' },
             { label: 'Tỷ lệ hoàn tất', val: `${stats.completionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:rotate-6`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.val}</p>
             </div>
           ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl inline-flex gap-2">
            {[
              { id: 'overview', label: 'Bảng điểm tổng quát', icon: BarChart3 },
              { id: 'analytics', label: 'Phân tích kỹ thuật', icon: PieChart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? 'chinese-gradient text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom duration-500">
             <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 md:p-12 space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-gray-900 flex items-center">
                         <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Top 3 Nhà Vô Địch
                      </h3>
                   </div>
                   
                   <div className="grid md:grid-cols-3 gap-6">
                      {results.slice(0, 3).map((r) => (
                        <div key={r._id} className="relative p-8 rounded-[2.5rem] border-2 border-amber-100 bg-amber-50/30 text-center space-y-4 group hover:scale-105 transition-all">
                           <div className="absolute top-4 right-4">{getRankIcon(r.rank)}</div>
                           <div className="w-20 h-20 rounded-2xl chinese-gradient flex items-center justify-center text-white text-2xl font-black mx-auto shadow-lg">
                              {r.user.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <p className="text-lg font-black text-gray-900">{r.user.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level {r.user.level}</p>
                           </div>
                           <div className="pt-4 border-t border-amber-100 flex justify-between items-center px-4">
                              <div className="text-left">
                                 <p className="text-[10px] font-black text-gray-400 uppercase">Score</p>
                                 <p className="text-xl font-black text-primary">{r.score}%</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-400 uppercase">Time</p>
                                 <p className="text-sm font-black text-gray-700">{formatTime(r.timeTaken)}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="pt-8 border-t border-gray-50 overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr>
                               <th className="pb-4 text-[10px] font-black uppercase text-gray-400 px-4">Rank</th>
                               <th className="pb-4 text-[10px] font-black uppercase text-gray-400 px-4">Participant</th>
                               <th className="pb-4 text-[10px] font-black uppercase text-gray-400 px-4 text-center">Score</th>
                               <th className="pb-4 text-[10px] font-black uppercase text-gray-400 px-4 text-right">Time Taken</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {results.slice(3).map((r) => (
                              <tr key={r._id} className="group hover:bg-gray-50 transition-colors">
                                 <td className="py-4 px-4 font-black text-gray-300">#{r.rank}</td>
                                 <td className="py-4 px-4">
                                    <div className="flex items-center space-x-3">
                                       <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">{r.user.name[0]}</div>
                                       <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">{r.user.name}</span>
                                    </div>
                                 </td>
                                 <td className="py-4 px-4 text-center">
                                    <span className={`text-sm font-black ${getScoreColor(r.score, r.totalQuestions)}`}>{r.score}%</span>
                                 </td>
                                 <td className="py-4 px-4 text-right">
                                    <span className="text-xs font-bold text-gray-400">{formatTime(r.timeTaken)}</span>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom duration-500">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                   <h3 className="text-xl font-black text-gray-900 flex items-center">
                      <PieChart className="w-6 h-6 mr-2 text-primary" /> Phân bố điểm số
                   </h3>
                   <div className="space-y-6">
                      {[
                        { label: 'Xuất sắc (90-100%)', count: stats.scoreDistribution.excellent, color: 'bg-green-500', bg: 'bg-green-50' },
                        { label: 'Khá giỏi (70-89%)', count: stats.scoreDistribution.good, color: 'bg-blue-500', bg: 'bg-blue-50' },
                        { label: 'Trung bình (50-69%)', count: stats.scoreDistribution.average, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
                        { label: 'Cần nỗ lực (0-49%)', count: stats.scoreDistribution.poor, color: 'bg-red-500', bg: 'bg-red-50' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-gray-500">{item.label}</span>
                              <span className="text-gray-900">{item.count} người</span>
                           </div>
                           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${(item.count / results.length) * 100}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                   <h3 className="text-xl font-black text-gray-900 flex items-center">
                      <Clock className="w-6 h-6 mr-2 text-primary" /> Phân bố tốc độ
                   </h3>
                   <div className="space-y-6">
                      {[
                        { label: 'Tốc độ tia chớp (<50% thời gian)', count: stats.timeDistribution.fast, color: 'bg-orange-500' },
                        { label: 'Tốc độ tiêu chuẩn (50-80% thời gian)', count: stats.timeDistribution.normal, color: 'bg-blue-500' },
                        { label: 'Chậm và chắc (>80% thời gian)', count: stats.timeDistribution.slow, color: 'bg-purple-500' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-gray-500">{item.label}</span>
                              <span className="text-gray-900">{item.count} người</span>
                           </div>
                           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${(item.count / results.length) * 100}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="pt-6 border-t border-gray-50">
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center space-x-3">
                         <Target className="w-5 h-5 text-gray-400" />
                         <p className="text-[10px] font-medium text-gray-500 leading-relaxed italic">"Dữ liệu được tổng hợp từ toàn bộ các đấu thủ đã hoàn thành bài thi."</p>
                      </div>
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}