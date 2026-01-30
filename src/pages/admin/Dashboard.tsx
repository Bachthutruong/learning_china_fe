import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Users,
  BookOpen,
  TestTube,
  Brain,
  Flag,
  TrendingUp,
  Activity,
  Award,
  Coins,
  LayoutDashboard,
  CheckCircle,
  Star
} from 'lucide-react'
import { api } from '../../services/api'

interface AdminStats {
  totalUsers: number
  totalVocabulary: number
  totalTests: number
  totalProficiencyTests: number
  pendingReports: number
  activeUsers: number
  totalExperience: number
  totalCoins: number
  testCompletionRate: number
  vocabularyLearningRate: number
  satisfactionRate: number
}

interface RecentActivity {
  id: string
  type: 'user_registered' | 'vocabulary_created' | 'test_completed' | 'report_submitted'
  description: string
  timestamp: string
  user?: string
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVocabulary: 0,
    totalTests: 0,
    totalProficiencyTests: 0,
    pendingReports: 0,
    activeUsers: 0,
    totalExperience: 0,
    totalCoins: 0,
    testCompletionRate: 0,
    vocabularyLearningRate: 0,
    satisfactionRate: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, activitiesResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activities')
      ])
      
      const s = statsResponse.data.stats ? statsResponse.data.stats : statsResponse.data
      setStats({
        totalUsers: s.totalUsers || 0,
        totalVocabulary: s.totalVocabulary || 0,
        totalTests: s.totalTests || 0,
        totalProficiencyTests: s.totalProficiencyTests || 0,
        pendingReports: s.pendingReports || 0,
        activeUsers: s.activeUsers || 0,
        totalExperience: s.totalExperience || 0,
        totalCoins: s.totalCoins || 0,
        testCompletionRate: s.testCompletionRate || 0,
        vocabularyLearningRate: s.vocabularyLearningRate || 0,
        satisfactionRate: s.satisfactionRate || 0
      })
      setRecentActivities(activitiesResponse.data?.activities || activitiesResponse.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return Users
      case 'vocabulary_created': return BookOpen
      case 'test_completed': return TestTube
      case 'report_submitted': return Flag
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered': return 'text-green-600'
      case 'vocabulary_created': return 'text-blue-600'
      case 'test_completed': return 'text-purple-600'
      case 'report_submitted': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <LayoutDashboard className="w-8 h-8 mr-3 text-primary" />
             Tổng quan hệ thống
          </h1>
          <p className="text-gray-500 font-medium">Theo dõi dữ liệu và hiệu suất vận hành thời gian thực.</p>
        </div>
        <Button 
          onClick={fetchDashboardData} 
          className="chinese-gradient h-12 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
        >
          <Activity className="mr-2 h-4 w-4" />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Kho từ vựng', value: stats.totalVocabulary, icon: BookOpen, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Bài test học', value: stats.totalTests, icon: TestTube, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Báo cáo chờ', value: stats.pendingReports, icon: Flag, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'User Active', value: stats.activeUsers, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Tổng XP', value: stats.totalExperience, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Tổng Xu', value: stats.totalCoins, icon: Coins, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Test Năng lực', value: stats.totalProficiencyTests, icon: Brain, color: 'text-cyan-600', bg: 'bg-cyan-50' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
             <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                   <item.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-gray-100 text-gray-400">
                   Realtime
                </Badge>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
             <div className="text-2xl font-black text-gray-900">{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Hoạt động gần đây</h3>
              <Button variant="ghost" className="text-xs font-black text-primary hover:bg-primary/5 rounded-xl">Xem tất cả</Button>
           </div>
           
           <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 6).map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-center justify-between group">
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl bg-gray-50 ${getActivityColor(activity.type)} flex items-center justify-center`}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-primary transition-colors">{activity.description}</p>
                             <p className="text-[10px] font-medium text-gray-400 mt-1 italic">{new Date(activity.timestamp).toLocaleString('vi-VN')}</p>
                          </div>
                       </div>
                       <Badge className="bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all rounded-lg font-bold text-[9px] uppercase">
                          {activity.type.split('_')[1]}
                       </Badge>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-gray-400 font-bold italic">Chưa có hoạt động nào được ghi nhận.</div>
              )}
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
           <h3 className="text-xl font-black text-gray-900">Chỉ số vận hành</h3>
           
           <div className="space-y-8">
              {[
                { label: 'Tỷ lệ hoàn thành test', val: stats.testCompletionRate, color: 'bg-green-500', icon: CheckCircle },
                { label: 'Tỷ lệ học từ vựng', val: stats.vocabularyLearningRate, color: 'bg-blue-500', icon: BookOpen },
                { label: 'Độ hài lòng (CSAT)', val: stats.satisfactionRate, color: 'bg-primary', icon: Star }
              ].map((prog, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                         <prog.icon className="w-4 h-4" />
                         <span>{prog.label}</span>
                      </div>
                      <span className="text-lg font-black text-gray-900">{prog.val}%</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${prog.color} transition-all duration-1000`}
                        style={{ width: `${prog.val}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 border-t border-gray-50">
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary">System Health</p>
                 <p className="text-xl font-black text-gray-900">Optimal (99.9%)</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}


