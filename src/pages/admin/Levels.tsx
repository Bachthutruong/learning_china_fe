import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
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

  const filteredLevels = levels.filter(level =>
    level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    level.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" />
        <p className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu cấp độ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center">
            <Target className="w-8 h-8 mr-3 text-primary" /> 
            Quản lý cấp độ
          </h1>
          <p className="text-gray-500 font-medium">Thiết lập lộ trình thăng tiến cho học viên.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowCreateDialog(true); }} 
          className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm cấp độ
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Tìm kiếm theo tên hoặc mô tả..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="h-12 pl-11 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
            />
         </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLevels.map((level) => {
          const IconComp = levelIcons.find(i => i.value === level.icon)?.icon || Star
          return (
            <div key={level._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
               <div className={`h-2 w-full ${level.color}`} />
               <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${level.color}`}>
                        <IconComp className="w-8 h-8" />
                     </div>
                     <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(level)} className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLevel(level._id)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Level {level.level || level.number}
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{level.name}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mt-3 line-clamp-2">
                      {level.description}
                    </p>
                  </div>

                  {/* Stats Section from Old Version */}
                  <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="h-3 w-3 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Từ vựng</span>
                      </div>
                      <div className="text-sm font-black text-gray-900">{level.vocabularyCount || 0}</div>
                    </div>
                    <div className="text-center border-x border-gray-50 px-1">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TestTube className="h-3 w-3 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Bài test</span>
                      </div>
                      <div className="text-sm font-black text-gray-900">{level.testCount || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Học viên</span>
                      </div>
                      <div className="text-sm font-black text-gray-900">{level.userCount || 0}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400">Yêu cầu EXP</span>
                    <div className="flex items-center text-primary font-black">
                      <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                      <span>{level.requiredExperience.toLocaleString()}</span>
                    </div>
                  </div>
               </div>
            </div>
          )
        })}
      </div>

      {filteredLevels.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Target className="w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Không tìm thấy cấp độ nào</h3>
              <p className="text-gray-500 font-medium">Thử thay đổi từ khóa tìm kiếm hoặc thêm cấp độ mới.</p>
           </div>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(o) => { if (!o) { setShowCreateDialog(false); setShowEditDialog(false); } }}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">
              {showEditDialog ? 'Hiệu chỉnh' : 'Tạo mới'} cấp độ
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-500">
              {showEditDialog ? 'Cập nhật thông tin chi tiết cho cấp độ học tập hiện tại.' : 'Thiết lập một cột mốc mới trên lộ trình học tập của học viên.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={showEditDialog ? handleEditLevel : handleCreateLevel} className="space-y-6 pt-4">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Số thứ tự Level</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={formData.level} 
                    onChange={(e) => setFormData({ ...formData, level: parseFloat(e.target.value) })} 
                    className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Tên cấp độ</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Ví dụ: Sơ cấp 1, HSK 1..."
                    className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                    required 
                  />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Yêu cầu EXP để đạt được</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={formData.requiredExperience} 
                  onChange={(e) => setFormData({ ...formData, requiredExperience: parseInt(e.target.value) })} 
                  className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                  required 
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Mô tả ngắn</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Mô tả kỹ năng học viên đạt được ở cấp độ này..."
                  className="min-h-[100px] rounded-2xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium" 
                />
             </div>
             
             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Màu sắc định danh</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map(c => (
                      <button 
                        key={c.value} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, color: c.value })} 
                        className={`h-8 rounded-lg ${c.value} transition-all ${formData.color === c.value ? 'ring-2 ring-primary ring-offset-2 scale-90 shadow-inner' : 'hover:scale-105'}`} 
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Biểu tượng</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {levelIcons.map(i => (
                      <button 
                        key={i.value} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, icon: i.value })} 
                        className={`h-10 flex flex-col items-center justify-center rounded-lg border-2 transition-all ${formData.icon === i.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        <i.icon className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase mt-1">{i.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
             </div>

             <DialogFooter className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }} 
                  className="flex-1 h-12 rounded-xl font-bold text-gray-400 hover:bg-gray-50"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading} 
                  className="flex-1 chinese-gradient h-12 rounded-xl font-black text-white shadow-xl shadow-primary/20"
                >
                  {formLoading ? <Loader2 className="animate-spin" /> : 'Lưu thông tin'}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-sm text-center border-none shadow-2xl">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
            <Trash2 className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Xác nhận xóa?</DialogTitle>
            <DialogDescription className="font-medium text-gray-500 leading-relaxed">
              Hành động này sẽ gỡ bỏ vĩnh viễn cấp độ này khỏi hệ thống. Các học viên đang ở cấp độ này sẽ bị ảnh hưởng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button 
              onClick={confirmDeleteLevel} 
              className="h-12 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
            >
              Đồng ý xóa
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteDialog(false)} 
              className="h-12 rounded-xl font-bold text-gray-400 hover:bg-gray-50"
            >
              Quay lại
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
