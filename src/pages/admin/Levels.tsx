import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Star,
  BookOpen,
  TestTube,
  Loader2,
  Award,
  Users
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Level {
  _id: string
  level?: number
  number: number
  name: string
  description: string
  requiredExperience: number
  color: string
  icon?: string
  vocabularyCount?: number
  testCount?: number
  userCount?: number
  createdAt: string
  updatedAt: string
}

interface LevelFormData {
  level: number
  name: string
  description: string
  requiredExperience: number
  color: string
  icon: string
}

const levelIcons = [
  { name: 'Ngôi sao', value: 'star', icon: Star },
  { name: 'Sách', value: 'book', icon: BookOpen },
  { name: 'Mục tiêu', value: 'target', icon: Target },
  { name: 'Giải thưởng', value: 'award', icon: Award },
  { name: 'Người dùng', value: 'users', icon: Users },
  { name: 'Test', value: 'test', icon: TestTube }
]

const colorOptions = [
  { name: 'Xanh dương', value: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Xanh lá', value: 'bg-green-500', hex: '#10b981' },
  { name: 'Đỏ', value: 'bg-red-500', hex: '#ef4444' },
  { name: 'Vàng', value: 'bg-yellow-500', hex: '#f59e0b' },
  { name: 'Tím', value: 'bg-purple-500', hex: '#8b5cf6' },
  { name: 'Hồng', value: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Cam', value: 'bg-orange-500', hex: '#f97316' },
  { name: 'Xanh ngọc', value: 'bg-cyan-500', hex: '#06b6d4' },
  { name: 'Xám', value: 'bg-gray-500', hex: '#6b7280' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366f1' }
]

export const AdminLevels = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [formData, setFormData] = useState<LevelFormData>({
    level: 1,
    name: '',
    description: '',
    requiredExperience: 0,
    color: 'bg-blue-500',
    icon: 'star'
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/levels')
      console.log('Levels response:', response.data)
      setLevels(response.data.levels || response.data || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast.error('Không thể tải danh sách cấp độ')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên cấp độ')
      return
    }

    if (formData.requiredExperience < 0) {
      toast.error('Điểm kinh nghiệm yêu cầu không được âm')
      return
    }

    try {
      setFormLoading(true)
      await api.post('/admin/levels', formData)
      
      toast.success('Tạo cấp độ thành công!')
      setShowCreateDialog(false)
      resetForm()
      fetchLevels()
    } catch (error: any) {
      console.error('Error creating level:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo cấp độ')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingLevel) return

    if (formData.requiredExperience < 0) {
      toast.error('Điểm kinh nghiệm yêu cầu không được âm')
      return
    }

    try {
      setFormLoading(true)
      await api.put(`/admin/levels/${editingLevel._id}`, formData)
      
      toast.success('Cập nhật cấp độ thành công!')
      setShowEditDialog(false)
      setEditingLevel(null)
      resetForm()
      fetchLevels()
    } catch (error: any) {
      console.error('Error updating level:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật cấp độ')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteLevel = (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteLevel = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/admin/levels/${deletingId}`)
      toast.success('Xóa cấp độ thành công!')
      setShowDeleteDialog(false)
      setDeletingId(null)
      fetchLevels()
    } catch (error: any) {
      console.error('Error deleting level:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa cấp độ')
    }
  }

  const resetForm = () => {
    setFormData({
      level: 1,
      name: '',
      description: '',
      requiredExperience: 0,
      color: 'bg-blue-500',
      icon: 'star'
    })
  }

  const openEditDialog = (level: Level) => {
    setEditingLevel(level)
    setFormData({
      level: level.level || level.number,
      name: level.name,
      description: level.description,
      requiredExperience: level.requiredExperience,
      color: level.color,
      icon: level.icon || 'star'
    })
    setShowEditDialog(true)
  }

  const getIconComponent = (iconName: string | undefined) => {
    const iconConfig = levelIcons.find(i => i.value === iconName)
    return iconConfig ? iconConfig.icon : Star
  }

  const filteredLevels = levels.filter(level =>
    level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    level.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý cấp độ</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý cấp độ</h1>
          <p className="text-gray-600">Quản lý các cấp độ học tập</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Thêm cấp độ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo cấp độ mới</DialogTitle>
              <DialogDescription>
                Tạo cấp độ học tập mới với yêu cầu và phần thưởng
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLevel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Số cấp độ *</Label>
                  <Input
                    id="level"
                    type="number"
                    step="0.1"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredExperience">Điểm kinh nghiệm yêu cầu *</Label>
                  <Input
                    id="requiredExperience"
                    type="number"
                    min="0"
                    value={formData.requiredExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredExperience: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Tên cấp độ *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Người mới bắt đầu, Trung cấp, Cao cấp..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về cấp độ này..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Biểu tượng</Label>
                <div className="grid grid-cols-3 gap-2">
                  {levelIcons.map((icon) => {
                    const IconComponent = icon.icon
                    return (
                      <button
                        key={icon.value}
                        type="button"
                        className={`p-3 rounded-lg border-2 ${
                          formData.icon === icon.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } hover:border-blue-300 transition-colors`}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                      >
                        <IconComponent className="h-6 w-6 mx-auto" />
                        <p className="text-xs mt-1">{icon.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Màu sắc</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-12 h-12 rounded-lg ${color.value} border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                      } hover:scale-105 transition-transform`}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      title={color.name}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Màu đã chọn: {colorOptions.find(c => c.value === formData.color)?.name}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo cấp độ'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa cấp độ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cấp độ
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditLevel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Số cấp độ *</Label>
                  <Input
                    id="edit-level"
                    type="number"
                    step="0.1"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-requiredExperience">Điểm kinh nghiệm yêu cầu *</Label>
                  <Input
                    id="edit-requiredExperience"
                    type="number"
                    min="0"
                    value={formData.requiredExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredExperience: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên cấp độ *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Người mới bắt đầu, Trung cấp, Cao cấp..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về cấp độ này..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Biểu tượng</Label>
                <div className="grid grid-cols-3 gap-2">
                  {levelIcons.map((icon) => {
                    const IconComponent = icon.icon
                    return (
                      <button
                        key={icon.value}
                        type="button"
                        className={`p-3 rounded-lg border-2 ${
                          formData.icon === icon.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } hover:border-blue-300 transition-colors`}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                      >
                        <IconComponent className="h-6 w-6 mx-auto" />
                        <p className="text-xs mt-1">{icon.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Màu sắc</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-12 h-12 rounded-lg ${color.value} border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                      } hover:scale-105 transition-transform`}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      title={color.name}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Màu đã chọn: {colorOptions.find(c => c.value === formData.color)?.name}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm cấp độ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Levels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLevels.map((level) => {
          const IconComponent = getIconComponent(level.icon || 'star')
          return (
            <Card key={level._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${level.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Cấp {level.level || level.number}: {level.name}
                      </CardTitle>
                      <CardDescription>
                        {level.requiredExperience} XP yêu cầu
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(level)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLevel(level._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {level.description && (
                  <p className="text-gray-600 text-sm">
                    {level.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Từ vựng</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {level.vocabularyCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TestTube className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Bài test</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {level.testCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Người dùng</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {level.userCount || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {new Date(level.createdAt).toLocaleDateString()}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${level.color}`} />
                    <span className="text-xs text-gray-500">
                      {level.color}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa cấp độ</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa cấp độ này?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteLevel}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredLevels.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không tìm thấy cấp độ nào
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Thử thay đổi từ khóa tìm kiếm'
                : 'Hãy thêm cấp độ đầu tiên'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


