import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
// import { Progress } from '../components/ui/progress'
import { 
  Star, 
  Zap, 
  Gem, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  TestTube, 
  Trophy,
  Target,
  Award,
  Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export const Dashboard = () => {
  const { user, setUser } = useAuth()
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const xpForNextLevel = 250
  const progressPercentage = (user?.experience || 0) / xpForNextLevel * 100

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true)
      const response = await api.post('/users/checkin')
      
      // Update user data with new values
      if (user) {
        setUser({
          ...user,
          level: response.data.user.level,
          experience: response.data.user.experience,
          coins: response.data.user.coins,
          streak: response.data.user.streak
        })
      }
      
      let message = `Check-in thành công! +${response.data.rewards.experience} XP, +${response.data.rewards.coins} xu`
      if (response.data.rewards.milestoneBonus) {
        message += `\n🎉 Milestone bonus: +${response.data.rewards.milestoneBonus} XP!`
      }
      toast.success(message)
    } catch (error: any) {
      console.error('Check-in error:', error)
      if (error.response?.status === 400) {
        toast.error('Bạn đã check-in hôm nay rồi!')
      } else {
        toast.error('Có lỗi xảy ra khi check-in')
      }
    } finally {
      setIsCheckingIn(false)
    }
  }

  const quickActions = [
    {
      title: 'Học từ vựng',
      description: 'Khám phá từ vựng mới',
      icon: BookOpen,
      href: '/vocabulary',
      color: 'from-blue-500 to-cyan-500',
      action: 'learn'
    },
    {
      title: 'Làm bài test',
      description: 'Kiểm tra kiến thức',
      icon: TestTube,
      href: '/tests',
      color: 'from-purple-500 to-pink-500',
      action: 'test'
    },
    {
      title: 'Test năng lực',
      description: 'Đánh giá trình độ',
      icon: Target,
      href: '/proficiency',
      color: 'from-green-500 to-emerald-500',
      action: 'proficiency'
    },
    {
      title: 'Cuộc thi',
      description: 'Tham gia thi đấu',
      icon: Trophy,
      href: '/competition',
      color: 'from-orange-500 to-red-500',
      action: 'competition'
    }
  ]

  const handleQuickAction = async (action: string) => {
    try {
      // Track user activity for analytics
      await api.post('/analytics/track', {
        action: action,
        timestamp: new Date().toISOString(),
        userId: user?.id
      })
    } catch (error) {
      console.error('Failed to track activity:', error)
      // Don't show error to user as this is not critical
    }
  }

  const achievements = [
    { title: 'Người mới bắt đầu', description: 'Hoàn thành bài học đầu tiên', icon: Award, completed: true },
    { title: 'Học viên chăm chỉ', description: 'Học 7 ngày liên tiếp', icon: Calendar, completed: false },
    { title: 'Thí sinh xuất sắc', description: 'Đạt 90% trong bài test', icon: Star, completed: false },
    { title: 'Nhà vô địch', description: 'Thắng cuộc thi', icon: Trophy, completed: false }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng trở lại, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">Đây là tóm tắt hành trình học tập của bạn.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cấp độ</CardTitle>
              <Star className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.level || 1}</div>
              <p className="text-xs opacity-90">Cấp độ tiếp theo ở {xpForNextLevel} XP</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kinh nghiệm (XP)</CardTitle>
              <Zap className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.experience || 0}</div>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Xu</CardTitle>
              <Gem className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.coins || 0}</div>
              <p className="text-xs opacity-90">Sử dụng trong cửa hàng</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-400 to-pink-500 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chuỗi ngày</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.streak || 0}</div>
              <p className="text-xs opacity-90">Ngày học liên tiếp</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Hành động nhanh
                </CardTitle>
                <CardDescription>
                  Tiếp tục hành trình học tập của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link 
                        key={action.title} 
                        to={action.href}
                        onClick={() => handleQuickAction(action.action)}
                      >
                        <Card className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                <p className="text-sm text-gray-600">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Daily Check-in */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Check-in hàng ngày
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Nhận phần thưởng mỗi ngày để duy trì chuỗi học tập
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold mb-1">+10 XP & +5 Xu</div>
                    <p className="text-blue-100">Phần thưởng hôm nay</p>
                  </div>
                  <Button 
                    className="bg-white text-blue-600 hover:bg-blue-50"
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Check-in ngay'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Thành tích
                </CardTitle>
                <CardDescription>
                  Theo dõi tiến độ và mở khóa thành tích
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon
                  return (
                    <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${achievement.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <Icon className={`h-5 w-5 ${achievement.completed ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${achievement.completed ? 'text-green-800' : 'text-gray-700'}`}>
                          {achievement.title}
                        </h4>
                        <p className={`text-sm ${achievement.completed ? 'text-green-600' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.completed && (
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
