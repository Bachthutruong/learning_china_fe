import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
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
  BookOpen,
  Loader2,
  Grid3X3,
  Table,
  ChevronLeft,
  ChevronRight
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
  
  // Pagination states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  
  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/topics')
      console.log('Topics API response:', response.data)
      const topicsData = response.data.topics || response.data || []
      
      // Fetch vocabulary count for each topic
      const topicsWithCount = await Promise.all(
        topicsData.map(async (topic: Topic) => {
          try {
            const vocabResponse = await api.get(`/admin/vocabularies?topic=${encodeURIComponent(topic.name)}`)
            const vocabularyCount = vocabResponse.data.vocabularies?.length || vocabResponse.data?.length || 0
            return { ...topic, vocabularyCount }
          } catch (error) {
            console.error(`Error fetching vocabulary count for topic ${topic.name}:`, error)
            return { ...topic, vocabularyCount: 0 }
          }
        })
      )
      
      setTopics(topicsWithCount)
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

  const openDeleteDialog = (topic: Topic) => {
    setTopicToDelete(topic)
    setShowDeleteDialog(true)
  }

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return

    try {
      setFormLoading(true)
      await api.delete(`/admin/topics/${topicToDelete._id}`)
      toast.success('Xóa chủ đề thành công!')
      setShowDeleteDialog(false)
      setTopicToDelete(null)
      fetchTopics()
    } catch (error: any) {
      console.error('Error deleting topic:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa chủ đề')
    } finally {
      setFormLoading(false)
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

  // Pagination logic
  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTopics = filteredTopics.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Helper function to get color value for display
  const getColorValue = (color: string) => {
    if (color.startsWith('#')) {
      return color // Hex color
    } else if (color.startsWith('bg-')) {
      return color // Tailwind class
    }
    return 'N/A'
  }

  // Helper function to get background color for inline styles
  const getBackgroundColor = (color: string) => {
    if (color.startsWith('#')) {
      return color // Use hex color directly
    } else if (color.startsWith('bg-')) {
      // Convert Tailwind class to hex color
      const colorMap: { [key: string]: string } = {
        'bg-blue-500': '#3b82f6',
        'bg-green-500': '#10b981',
        'bg-red-500': '#ef4444',
        'bg-yellow-500': '#f59e0b',
        'bg-purple-500': '#8b5cf6',
        'bg-pink-500': '#ec4899',
        'bg-orange-500': '#f97316',
        'bg-cyan-500': '#06b6d4',
        'bg-gray-500': '#6b7280',
        'bg-indigo-500': '#6366f1'
      }
      return colorMap[color] || '#6b7280' // Default gray if not found
    }
    return '#6b7280' // Default gray
  }

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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa chủ đề</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa chủ đề "{topicToDelete?.name}"? 
                Tất cả từ vựng liên quan sẽ bị ảnh hưởng. Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteTopic}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
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
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-sm">Hiển thị:</Label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTopics.map((topic) => (
            <Card key={topic._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: getBackgroundColor(topic.color) }}
                    />
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
                      onClick={() => openDeleteDialog(topic)}
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
                  <div 
                    className="w-6 h-6 rounded border border-gray-200" 
                    style={{ backgroundColor: getBackgroundColor(topic.color) }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chủ đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Màu sắc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Từ vựng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTopics.map((topic) => (
                  <tr key={topic._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: getBackgroundColor(topic.color) }}
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {topic.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {topic.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded border border-gray-200 mr-2" 
                          style={{ backgroundColor: getBackgroundColor(topic.color) }}
                        />
                        <span className="text-sm text-gray-600">
                          {getColorValue(topic.color)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {topic.vocabularyCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                          onClick={() => openDeleteDialog(topic)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredTopics.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredTopics.length)} trong tổng số {filteredTopics.length} chủ đề
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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


