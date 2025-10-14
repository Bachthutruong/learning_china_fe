import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import { 
  // User, 
  // Mail, 
  Star, 
  // Gem, 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  BookOpen,
  TestTube,
  Trophy,
  // Settings,
  Edit,
  Save,
  X,
  Loader2,
  RotateCcw
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { TopicQuiz } from '../components/TopicQuiz'

interface Report {
  _id: string
  type: string
  targetId: string
  category: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  rewardExperience?: number
  rewardCoins?: number
  createdAt: string
}

interface PersonalTopic {
  _id: string
  name: string
  description: string
  vocabularyCount: number
  createdAt: string
}

interface UserVocabulary {
  _id: string
  vocabularyId: {
    _id: string
    word: string
    pronunciation: string
    meaning: string
    level: number
    audioUrl?: string
  }
  personalTopicId: {
    _id: string
    name: string
  }
  status: 'studying' | 'learned' | 'skipped'
  addedAt: string
}

export const Profile = () => {
  const { user, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState([
    { title: 'Người mới bắt đầu', description: 'Hoàn thành bài học đầu tiên', icon: Award, completed: false, date: null },
    { title: 'Học viên chăm chỉ', description: 'Học 7 ngày liên tiếp', icon: Calendar, completed: false, date: null },
    { title: 'Thí sinh xuất sắc', description: 'Đạt 90% trong bài test', icon: Star, completed: false, date: null },
    { title: 'Nhà vô địch', description: 'Thắng cuộc thi', icon: Trophy, completed: false, date: null }
  ])
  const [learningStats, setLearningStats] = useState({
    vocabularyLearned: 0,
    testsCompleted: 0,
    competitionsJoined: 0
  })
  const [personalTopics, setPersonalTopics] = useState<PersonalTopic[]>([])
  const [userVocabularies, setUserVocabularies] = useState<UserVocabulary[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [showTopicQuiz, setShowTopicQuiz] = useState(false)
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<{id: string, name: string} | null>(null)

  useEffect(() => {
    fetchReports()
    fetchAchievements()
    fetchLearningStats()
    fetchPersonalTopics()
    fetchUserVocabularies()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reports')
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast.error('Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/users/achievements')
      setAchievements(response.data.achievements || achievements)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      // Keep default achievements if API fails
    }
  }

  const fetchLearningStats = async () => {
    try {
      const response = await api.get('/users/learning-stats')
      setLearningStats(response.data.stats || learningStats)
    } catch (error) {
      console.error('Failed to fetch learning stats:', error)
      // Keep default stats if API fails
    }
  }

  const fetchPersonalTopics = async () => {
    try {
      const response = await api.get('/vocabulary-learning/user/personal-topics')
      const topics = Array.isArray(response.data?.topics)
        ? response.data.topics
        : Array.isArray(response.data)
          ? response.data
          : []
      setPersonalTopics(topics)
    } catch (error) {
      console.error('Failed to fetch personal topics:', error)
    }
  }

  const fetchUserVocabularies = async () => {
    try {
      const response = await api.get('/vocabulary-learning/user/vocabularies')
      const items = Array.isArray(response.data?.vocabularies)
        ? response.data.vocabularies
        : Array.isArray(response.data)
          ? response.data
          : []
      setUserVocabularies(items)
    } catch (error) {
      console.error('Failed to fetch user vocabularies:', error)
    }
  }

  const startTopicQuiz = (topicId: string, topicName: string) => {
    setSelectedTopicForQuiz({ id: topicId, name: topicName })
    setShowTopicQuiz(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt'
      case 'pending': return 'Chờ xử lý'
      case 'rejected': return 'Đã từ chối'
      default: return status
    }
  }

  const handleSave = async () => {
    try {
      await api.put('/users/profile', { name: editedName });
      setUser({ ...user!, name: editedName });
      setIsEditing(false);
      toast.success("Cập nhật thành công! Thông tin cá nhân đã được cập nhật");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Không thể cập nhật thông tin cá nhân");
    }
  }

  const handleCancel = () => {
    setEditedName(user?.name || '')
    setIsEditing(false)
  }

  const xpForNextLevel = 250
  const progressPercentage = (user?.experience || 0) / xpForNextLevel * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi tiến độ học tập</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="text-3xl">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" />
                        Lưu
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.name}</h2>
                    <p className="text-gray-600 mb-4">{user?.email}</p>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Thống kê
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cấp độ</span>
                  <Badge variant="outline">Lv.{user?.level || 1}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kinh nghiệm</span>
                  <span className="font-semibold">{user?.experience || 0} XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Xu</span>
                  <span className="font-semibold">{user?.coins || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chuỗi ngày</span>
                  <span className="font-semibold">{user?.streak || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Tiến độ cấp độ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cấp {user?.level || 1}</span>
                    <span>Cấp {(user?.level || 1) + 1}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-center text-sm text-gray-600">
                    {user?.experience || 0} / {xpForNextLevel} XP
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Báo cáo của tôi
                </CardTitle>
                <CardDescription>Lịch sử các báo cáo lỗi bạn đã gửi</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Đang tải báo cáo...</span>
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{report.type}</Badge>
                            <span className="font-medium text-sm">{report.category}</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(report.status)}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Mô tả:</strong> {report.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          {report.rewardExperience && report.rewardCoins && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">+{report.rewardExperience} XP</span>
                              <span className="text-blue-600">+{report.rewardCoins} xu</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Bạn chưa có báo cáo nào</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Thành tích
                </CardTitle>
                <CardDescription>Danh hiệu và thành tích bạn đã đạt được</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => {
                    const RawIcon: any = (achievement as any).icon
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          achievement.completed 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {typeof RawIcon === 'function' ? (
                            <RawIcon className={`h-5 w-5 ${
                              achievement.completed ? 'text-white' : 'text-gray-500'
                            }`} />
                          ) : React.isValidElement(RawIcon) ? (
                            RawIcon
                          ) : (
                            <span className={`text-lg ${
                              achievement.completed ? 'text-white' : 'text-gray-700'
                            }`}>{typeof RawIcon === 'string' ? RawIcon : '🏅'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            achievement.completed ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-sm ${
                            achievement.completed ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                          {achievement.completed && achievement.date && (
                            <p className="text-xs text-green-600 mt-1">
                              Đạt được: {achievement.date}
                            </p>
                          )}
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
                </div>
              </CardContent>
            </Card>

            {/* Personal Topics and Vocabularies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Chủ đề và từ vựng của bạn
                </CardTitle>
                <CardDescription>Quản lý chủ đề cá nhân và từ vựng đang học</CardDescription>
              </CardHeader>
              <CardContent>
                {personalTopics.length > 0 ? (
                  <div className="space-y-6">
                {/* Topic Filter */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedTopic === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTopic('all')}
                    >
                      Tất cả
                    </Button>
                    {personalTopics.map((topic) => (
                      <div key={topic._id} className="flex items-center gap-2">
                        <Button
                          variant={selectedTopic === topic._id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTopic(topic._id)}
                        >
                          {topic.name} ({topic.vocabularyCount})
                        </Button>
                        {topic.vocabularyCount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startTopicQuiz(topic._id, topic.name)}
                            className="text-xs"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Khảo bài
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    💡 Click vào chủ đề để lọc, click "Khảo bài" để kiểm tra từ vựng đã học
                  </div>
                </div>

                    {/* Vocabularies List */}
                    <div className="space-y-3">
                      {(Array.isArray(userVocabularies) ? userVocabularies : [])
                        .filter((vocab) => selectedTopic === 'all' || vocab.personalTopicId?._id === selectedTopic)
                        .map((userVocab) => (
                          <div key={userVocab._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{userVocab.vocabularyId.word}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Cấp {userVocab.vocabularyId.level}
                                </Badge>
                                <Badge 
                                  variant={userVocab.status === 'learned' ? 'default' : userVocab.status === 'studying' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {userVocab.status === 'learned' ? 'Đã học' : userVocab.status === 'studying' ? 'Đang học' : 'Bỏ qua'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {userVocab.vocabularyId.pronunciation} - {userVocab.vocabularyId.meaning}
                              </p>
                              <p className="text-xs text-gray-500">
                                Chủ đề: {userVocab.personalTopicId?.name}
                              </p>
                            </div>
                            {userVocab.vocabularyId.audioUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const audio = new Audio(userVocab.vocabularyId.audioUrl!)
                                  audio.play().catch(console.error)
                                }}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>

                    {(Array.isArray(userVocabularies) ? userVocabularies : []).filter((vocab) => selectedTopic === 'all' || vocab.personalTopicId?._id === selectedTopic).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Chưa có từ vựng nào trong chủ đề này</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Bạn chưa tạo chủ đề nào</p>
                    <p className="text-sm">Hãy vào phần "Học từ vựng" để tạo chủ đề đầu tiên</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Tóm tắt học tập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{learningStats.vocabularyLearned}</div>
                    <div className="text-sm text-gray-600">Từ vựng đã học</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TestTube className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{learningStats.testsCompleted}</div>
                    <div className="text-sm text-gray-600">Bài test hoàn thành</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{learningStats.competitionsJoined}</div>
                    <div className="text-sm text-gray-600">Cuộc thi tham gia</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Topic Quiz */}
        {selectedTopicForQuiz && (
          <TopicQuiz
            topicId={selectedTopicForQuiz.id}
            topicName={selectedTopicForQuiz.name}
            isOpen={showTopicQuiz}
            onClose={() => {
              setShowTopicQuiz(false)
              setSelectedTopicForQuiz(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
