import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Palette,
  BookOpen,
  Loader2,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Topic {
  _id: string
  name: string
  color: string
  description: string
  vocabularyCount?: number
  createdAt: string
  updatedAt: string
}

interface TopicFormData {
  name: string
  color: string
  description: string
}

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

export const AdminTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    color: 'bg-blue-500',
    description: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/topics')
      setTopics(response.data.topics || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
      toast.error('Không thể tải danh sách chủ đề')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chủ đề')
      return
    }

    try {
      setFormLoading(true)
      await api.post('/admin/topics', formData)
      
      toast.success('Tạo chủ đề thành công!')
      setShowCreateDialog(false)
      resetForm()
      fetchTopics()
    } catch (error: any) {
      console.error('Error creating topic:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo chủ đề')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTopic) return

    try {
      setFormLoading(true)
      await api.put(`/admin/topics/${editingTopic._id}`, formData)
      
      toast.success('Cập nhật chủ đề thành công!')
      setShowEditDialog(false)
      setEditingTopic(null)
      resetForm()
      fetchTopics()
    } catch (error: any) {
      console.error('Error updating topic:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật chủ đề')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chủ đề này? Tất cả từ vựng liên quan sẽ bị ảnh hưởng.')) return

    try {
      await api.delete(`/admin/topics/${id}`)
      toast.success('Xóa chủ đề thành công!')
      fetchTopics()
    } catch (error: any) {
      console.error('Error deleting topic:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa chủ đề')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: 'bg-blue-500',
      description: ''
    })
  }

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic)
    setFormData({
      name: topic.name,
      color: topic.color,
      description: topic.description
    })
    setShowEditDialog(true)
  }

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý chủ đề</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý chủ đề</h1>
          <p className="text-gray-600">Quản lý các chủ đề học tập</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Thêm chủ đề
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo chủ đề mới</DialogTitle>
              <DialogDescription>
                Tạo chủ đề học tập mới để phân loại từ vựng
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên chủ đề *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Gia đình, Thực phẩm, Du lịch..."
                  required
                />
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

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về chủ đề này..."
                  rows={3}
                />
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
                    'Tạo chủ đề'
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
              <DialogTitle>Chỉnh sửa chủ đề</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chủ đề
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên chủ đề *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Gia đình, Thực phẩm, Du lịch..."
                  required
                />
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

              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về chủ đề này..."
                  rows={3}
                />
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
              placeholder="Tìm kiếm chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic) => (
          <Card key={topic._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${topic.color}`} />
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {topic.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(topic)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTopic(topic._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {topic.description && (
                <p className="text-gray-600 text-sm">
                  {topic.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {topic.vocabularyCount || 0} từ vựng
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(topic.createdAt).toLocaleDateString()}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Màu:</span>
                <div className={`w-6 h-6 rounded ${topic.color} border border-gray-200`} />
                <span className="text-sm text-gray-600">
                  {colorOptions.find(c => c.value === topic.color)?.name}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không tìm thấy chủ đề nào
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Thử thay đổi từ khóa tìm kiếm'
                : 'Hãy thêm chủ đề đầu tiên'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


