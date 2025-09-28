import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Brain,
  Settings,
  Crown,
  Zap,
  Target,
  Award
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'


interface ProficiencyConfig {
  _id: string
  name: string
  description: string
  cost: number
  initialQuestions: {
    level: number
    count: number
  }[]
  branches: {
    name: string
    condition: {
      correctRange: [number, number]
      fromPhase: 'initial' | 'followup' | 'final'
    }
    nextQuestions: {
      level: number
      count: number
    }[]
    resultLevel?: number
    nextPhase?: 'followup' | 'final'
    subBranches?: any[]
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const ProficiencyConfigPage = () => {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState<ProficiencyConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/proficiency-configs')
      setConfigs(response.data.configs || [])
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('Không thể tải danh sách cấu hình')
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteConfig = async (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      await api.delete(`/admin/proficiency-configs/${deletingId}`)
      toast.success('Xóa cấu hình thành công!')
      fetchConfigs()
    } catch (error: any) {
      console.error('Error deleting config:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa cấu hình')
    } finally {
      setShowDeleteDialog(false)
      setDeletingId(null)
    }
  }

  const handleActivateConfig = async (id: string) => {
    try {
      await api.post(`/admin/proficiency-configs/${id}/activate`)
      toast.success('Kích hoạt cấu hình thành công!')
      fetchConfigs()
    } catch (error: any) {
      console.error('Error activating config:', error)
      toast.error(error.response?.data?.message || 'Không thể kích hoạt cấu hình')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/proficiency')}
              className="mb-6 bg-white/50 hover:bg-white/70 border-2 border-blue-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </Button>
            
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ⚙️ Cấu hình Test năng lực
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Settings className="h-8 w-8 text-blue-400 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-gray-700 font-medium">
                Quản lý cấu hình test năng lực
              </p>
            </div>
          </div>

          {/* Configs List */}
          {configs.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                    Chưa có cấu hình nào
                  </h3>
                  <p className="text-gray-500">
                    Hãy tạo cấu hình đầu tiên để bắt đầu
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/admin/proficiency-config/new')}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Tạo cấu hình đầu tiên
                  <Settings className="h-5 w-5 ml-3" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {configs.map((config) => (
                <Card key={config._id} className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                          <Brain className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{config.name}</CardTitle>
                          <CardDescription className="text-blue-100">
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isActive && (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Đang hoạt động
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/proficiency-config/${config._id}/edit`)}
                          className="text-white hover:bg-white/20"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfig(config._id)}
                          className="text-red-200 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-gray-700">Chi phí</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {config.cost.toLocaleString()} xu
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="font-semibold text-gray-700">Câu hỏi ban đầu</span>
                        </div>
                        <p className="text-lg font-semibold text-green-600">
                          {config.initialQuestions.length} cấp độ
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-gray-700">Nhánh logic</span>
                        </div>
                        <p className="text-lg font-semibold text-purple-600">
                          {config.branches.length} nhánh
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                      {!config.isActive && (
                        <Button
                          onClick={() => handleActivateConfig(config._id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Kích hoạt
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/proficiency-config/${config._id}/edit`)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Button */}
          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/admin/proficiency-config/new')}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-6 w-6 mr-3" />
              Tạo cấu hình mới
              <Settings className="h-5 w-5 ml-3" />
            </Button>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Xác nhận xóa cấu hình</DialogTitle>
                <DialogDescription>
                  Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa cấu hình này?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Xóa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
