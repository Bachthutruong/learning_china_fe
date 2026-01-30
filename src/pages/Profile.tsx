import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import {
  Star,
  Gem,
  TrendingUp,
  Calendar,
  Award,
  Target,
  BookOpen,
  TestTube,
  Trophy,
  Edit,
  Save,
  X,
  Loader2,
  RotateCcw,
  Flame,
  CheckCircle,
  Zap
} from 'lucide-react'
import { Input } from '../components/ui/input'
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
      await api.put('/auth/profile', { name: editedName });
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Hồ sơ <span className="text-primary">Cá nhân</span></h1>
            <p className="text-gray-500 font-medium">Nơi lưu giữ những cột mốc quan trọng trong hành trình học Hán ngữ.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-2xl border-2 font-bold h-12 px-6 hover:bg-primary/5 hover:text-primary transition-all"
          >
            {isEditing ? <X className="w-5 h-5 mr-2" /> : <Edit className="w-5 h-5 mr-2" />}
            {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Stats */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-5 rounded-bl-[4rem]" />
               
               <div className="relative z-10">
                  <div className="relative inline-block mb-6">
                    <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl ring-4 ring-primary/10 transition-transform group-hover:scale-105 duration-500">
                      <AvatarImage src="" alt={user?.name} />
                      <AvatarFallback className="text-4xl font-black chinese-gradient text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
                       <Award className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-center h-12 rounded-xl font-bold border-2 focus:border-primary"
                      />
                      <Button onClick={handleSave} className="w-full chinese-gradient h-12 rounded-xl font-black">
                        <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-gray-900">{user?.name}</h2>
                      <p className="text-sm text-gray-400 font-bold italic uppercase tracking-widest">{user?.email}</p>
                    </div>
                  )}
               </div>

               <div className="relative z-10 grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cấp độ</p>
                     <p className="text-xl font-black text-gray-900">Lv.{user?.level}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Chuỗi ngày</p>
                     <p className="text-xl font-black text-primary flex items-center justify-center">
                        <Flame className="w-5 h-5 mr-1 fill-current" /> {user?.streak}
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
               <h3 className="text-xl font-black text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Tiến độ hiện tại
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                     <span>{user?.experience} XP</span>
                     <span>{xpForNextLevel} XP</span>
                  </div>
                  <div className="h-4 bg-gray-50 rounded-full overflow-hidden p-1 shadow-inner">
                     <div 
                       className="h-full chinese-gradient rounded-full transition-all duration-1000"
                       style={{ width: `${progressPercentage}%` }}
                     />
                  </div>
                  <p className="text-center text-xs font-bold text-gray-500 italic">
                     Còn {(xpForNextLevel - (user?.experience || 0))} XP nữa để lên cấp mới
                  </p>
               </div>
            </div>
          </div>

          {/* Right Column: Achievements & Activities */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { label: 'Từ vựng', value: learningStats.vocabularyLearned, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: 'Bài test', value: learningStats.testsCompleted, icon: TestTube, color: 'text-green-600', bg: 'bg-green-50' },
                 { label: 'Cuộc thi', value: learningStats.competitionsJoined, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4 group hover:shadow-md transition-all">
                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6`}>
                       <stat.icon className="w-7 h-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                       <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Achievements Section */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
               <h3 className="text-xl font-black text-gray-900 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-amber-500 fill-current" />
                  Danh hiệu danh giá
               </h3>
               
               <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-4 p-5 rounded-3xl border transition-all ${
                        achievement.completed 
                        ? 'bg-white border-primary/20 shadow-md ring-1 ring-primary/5' 
                        : 'bg-gray-50/50 border-gray-100 grayscale opacity-60'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        achievement.completed ? 'chinese-gradient text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                      }`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm truncate ${achievement.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-medium line-clamp-1 italic">
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.completed && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Reports Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Lịch sử đóng góp
                  </h3>
                  <Badge variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-400">
                    {reports.length} Báo cáo
                  </Badge>
               </div>

               {loading ? (
                 <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
               ) : reports.length > 0 ? (
                 <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report._id} className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                               <Badge className="rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-widest">{report.type}</Badge>
                               <span className="text-xs font-black text-gray-400">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <Badge variant={getStatusBadgeVariant(report.status)} className="rounded-xl font-black uppercase text-[9px]">
                               {getStatusText(report.status)}
                            </Badge>
                         </div>
                         <p className="text-sm text-gray-700 font-medium leading-relaxed italic">"{report.description}"</p>
                         {(report.rewardExperience || report.rewardCoins) && (
                           <div className="pt-2 flex items-center space-x-4">
                              <span className="text-[10px] font-black text-green-600 flex items-center">
                                 <Zap className="w-3 h-3 mr-1" /> +{report.rewardExperience} XP
                              </span>
                              <span className="text-[10px] font-black text-amber-500 flex items-center">
                                 <Gem className="w-3 h-3 mr-1" /> +{report.rewardCoins} Xu
                              </span>
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                       <Edit className="w-8 h-8" />
                    </div>
                    <p className="text-gray-400 font-bold italic">Bạn chưa thực hiện báo cáo đóng góp nào.</p>
                 </div>
               )}
            </div>

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