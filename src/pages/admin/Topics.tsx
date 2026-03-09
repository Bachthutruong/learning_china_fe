import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import {
  Layers, Plus, Edit, Trash2, Search, BookOpen, Loader2, Grid3X3, Table
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const getBackgroundColor = (color: string) => {
  if (color.startsWith('#')) return color
  const map: Record<string, string> = {
    'bg-blue-500': '#3b82f6', 'bg-green-500': '#10b981', 'bg-red-500': '#ef4444',
    'bg-yellow-500': '#f59e0b', 'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-orange-500': '#f97316', 'bg-cyan-500': '#06b6d4', 'bg-gray-500': '#6b7280',
    'bg-indigo-500': '#6366f1'
  }
  return map[color] || '#6b7280'
}

export const AdminTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState<TopicFormData>({ name: '', color: 'bg-blue-500', description: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  useEffect(() => { fetchTopics() }, [currentPage, itemsPerPage])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1)
      else fetchTopics()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/topics', {
        params: { page: currentPage, limit: itemsPerPage, search: searchTerm }
      })

      let topicsData: Topic[] = []
      if (res.data.topics) {
        topicsData = res.data.topics
        setTotalPages(res.data.totalPages || 1)
        setTotalItems(res.data.total || res.data.topics.length)
      } else if (Array.isArray(res.data)) {
        topicsData = res.data
        setTotalPages(1)
        setTotalItems(res.data.length)
      } else {
        topicsData = []
        setTotalPages(1)
        setTotalItems(0)
      }

      // Fetch vocabulary count for each topic
      const topicsWithCount = await Promise.all(
        topicsData.map(async (topic) => {
          try {
            const vocabRes = await api.get(`/admin/vocabularies?topic=${encodeURIComponent(topic.name)}`)
            const vocabularyCount = vocabRes.data.vocabularies?.length || vocabRes.data?.length || 0
            return { ...topic, vocabularyCount }
          } catch {
            return { ...topic, vocabularyCount: 0 }
          }
        })
      )
      setTopics(topicsWithCount)
    } catch {
      toast.error('Không thể tải danh sách chủ đề')
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => setFormData({ name: '', color: 'bg-blue-500', description: '' })

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error('Vui lòng nhập tên chủ đề'); return }
    try {
      setFormLoading(true)
      await api.post('/admin/topics', formData)
      toast.success('Tạo chủ đề thành công!')
      setShowCreateDialog(false); resetForm(); fetchTopics()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo chủ đề')
    } finally { setFormLoading(false) }
  }

  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTopic) return
    try {
      setFormLoading(true)
      await api.put(`/admin/topics/${editingTopic._id}`, formData)
      toast.success('Cập nhật chủ đề thành công!')
      setShowEditDialog(false); setEditingTopic(null); resetForm(); fetchTopics()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật chủ đề')
    } finally { setFormLoading(false) }
  }

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic)
    setFormData({ name: topic.name, color: topic.color, description: topic.description })
    setShowEditDialog(true)
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
      setShowDeleteDialog(false); setTopicToDelete(null); fetchTopics()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa chủ đề')
    } finally { setFormLoading(false) }
  }

  // Shared form fields renderer
  const renderFormFields = () => (
    <>
      <div className="space-y-2">
        <Label>Tên chủ đề *</Label>
        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Gia đình, Thực phẩm, Du lịch..." required className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Màu sắc</Label>
        <div className="grid grid-cols-5 gap-3">
          {colorOptions.map(c => (
            <button key={c.value} type="button" onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
              className={`w-12 h-12 rounded-xl border-2 hover:scale-105 transition-transform ${c.value} ${formData.color === c.value ? 'border-gray-900 ring-2 ring-offset-2' : 'border-transparent'}`}
              title={c.name} />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-bold">
          Màu đã chọn: {colorOptions.find(c => c.value === formData.color)?.name}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Mô tả</Label>
        <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả về chủ đề này..." rows={3} className="rounded-xl" />
      </div>
    </>
  )

  return (
    <div className="space-y-4 sm:space-y-8 pb-8 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center"><Layers className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary shrink-0" /> Chủ đề</h1>
        <Button onClick={() => { resetForm(); setEditingTopic(null); setShowCreateDialog(true) }} className="chinese-gradient text-white rounded-xl min-h-[44px] w-full sm:w-auto" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Tạo mới
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border shadow-xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <Input placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 sm:pl-11 rounded-xl h-11 min-h-[44px]" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg" onClick={() => setViewMode('grid')}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg" onClick={() => setViewMode('table')}><Table className="w-4 h-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase hidden xs:inline">Hiển thị</span>
            <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1) }}>
              <SelectTrigger className="w-20 sm:w-24 h-10 rounded-xl min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="18">18</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-[2.5rem] border shadow-sm animate-pulse">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl mb-4 sm:mb-6" />
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 mb-2 sm:mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        topics.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-[2.5rem] border shadow-xl py-12 sm:py-20 text-center px-4">
            <Layers className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-black text-gray-400">Không tìm thấy chủ đề nào</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy thêm chủ đề đầu tiên'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {topics.map(t => (
              <div key={t._id} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2.5rem] border shadow-sm group hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: getBackgroundColor(t.color) }}>
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-xl" onClick={() => openEditDialog(t)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-xl" onClick={() => openDeleteDialog(t)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                <h3 className="text-lg sm:text-2xl font-black mt-4 sm:mt-6 line-clamp-1">{t.name}</h3>
                {t.description && <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{t.description}</p>}

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-500 font-bold">{t.vocabularyCount || 0} từ vựng</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] rounded-lg">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-400">Màu:</span>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border shrink-0" style={{ backgroundColor: getBackgroundColor(t.color) }} />
                    <span className="text-xs text-gray-400 truncate">{colorOptions.find(c => c.value === t.color)?.name || t.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl sm:rounded-[2.5rem] border shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-gray-50/50 border-b">
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400">Chủ đề</th>
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 hidden md:table-cell">Mô tả</th>
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400">Màu</th>
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 text-center">Từ vựng</th>
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topics.map(t => (
                  <tr key={t._id} className="group hover:bg-gray-50/50">
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0" style={{ backgroundColor: getBackgroundColor(t.color) }} />
                        <span className="font-black text-sm sm:text-base truncate">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-gray-500 line-clamp-1 max-w-xs">{t.description || '—'}</span>
                    </td>
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border shrink-0" style={{ backgroundColor: getBackgroundColor(t.color) }} />
                        <span className="text-xs text-gray-400 truncate max-w-[80px] sm:max-w-none">{colorOptions.find(c => c.value === t.color)?.name || t.color}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-center">
                      <span className="text-sm font-bold">{t.vocabularyCount || 0}</span>
                    </td>
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-sm text-gray-500 hidden lg:table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-9 min-h-[44px] rounded-xl" onClick={() => openEditDialog(t)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-9 min-h-[44px] rounded-xl text-red-500" onClick={() => openDeleteDialog(t)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {topics.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400 font-bold text-sm">Không tìm thấy chủ đề nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {topics.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Hiển thị {topics.length} / {totalItems} chủ đề</span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl font-bold min-h-[44px]">Trước</Button>
            {totalPages > 1 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number
              if (totalPages <= 5) page = i + 1
              else if (currentPage <= 3) page = i + 1
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
              else page = currentPage - 2 + i
              return (
                <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} size="sm" onClick={() => setCurrentPage(page)}
                  className={`rounded-xl font-black min-h-[44px] min-w-[44px] ${currentPage === page ? 'chinese-gradient text-white' : ''}`}>{page}</Button>
              )
            })}
            <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl font-bold min-h-[44px]">Tiếp</Button>
          </div>
          <span className="bg-white px-4 py-2 rounded-xl border font-black text-xs sm:text-sm text-center">Trang {currentPage}/{totalPages}</span>
        </div>
      )}

      {/* Create Dialog - mobile */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Tạo chủ đề mới</DialogTitle>
            <DialogDescription>Tạo chủ đề học tập mới để phân loại từ vựng</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTopic} className="space-y-6">
            {renderFormFields()}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreateDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy</Button>
              <Button type="submit" disabled={formLoading} className="flex-1 chinese-gradient text-white rounded-xl h-12 font-black">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Tạo chủ đề'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - mobile */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Chỉnh sửa chủ đề</DialogTitle>
            <DialogDescription>Cập nhật thông tin chủ đề</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTopic} className="space-y-6">
            {renderFormFields()}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowEditDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy</Button>
              <Button type="submit" disabled={formLoading} className="flex-1 chinese-gradient text-white rounded-xl h-12 font-black">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog - mobile */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 text-center max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Xóa chủ đề?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chủ đề "{topicToDelete?.name}"?
              Tất cả từ vựng liên quan sẽ bị ảnh hưởng. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={handleDeleteTopic} disabled={formLoading} className="h-12 rounded-xl font-black text-white bg-red-500 hover:bg-red-600">
              {formLoading ? <Loader2 className="animate-spin" /> : 'Xóa'}
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="h-12 rounded-xl font-bold">Hủy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
