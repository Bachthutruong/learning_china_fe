import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import { Edit, Trash2, Plus, Search, Users as UsersIcon, Shield, Coins, Star, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

interface UserItem {
  _id: string
  name: string
  email: string
  level: number
  experience?: number
  coins: number
  role: string
}

interface ExperienceRange {
  level: number
  minExperience: number
  maxExperience?: number
  range: string
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [password, setPassword] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [experienceRange, setExperienceRange] = useState<ExperienceRange | null>(null)
  const [loadingRange, setLoadingRange] = useState(false)
  const [originalLevel, setOriginalLevel] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, search])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { page, limit: pageSize, search } })
      if (res.data) {
        setUsers(res.data.users || res.data || [])
        setTotalUsers(res.data.total || (res.data.users ? res.data.users.length : 0))
        setTotalPages(res.data.totalPages || 1)
      }
    } catch { 
      setUsers([]) 
      toast.error('Không thể tải danh sách người dùng')
    }
  }

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!editing) return

    // Validate experience if level changed
    if (editing._id && originalLevel !== null && originalLevel !== editing.level) {
      if (!experienceRange) {
        toast.error('Vui lòng chờ hệ thống lấy khoảng experience')
        return
      }
      const exp = editing.experience || experienceRange.minExperience
      if (exp < experienceRange.minExperience) {
        toast.error(`Experience phải tối thiểu ${experienceRange.minExperience}`)
        return
      }
      if (experienceRange.maxExperience !== undefined && exp > experienceRange.maxExperience) {
        toast.error(`Experience phải tối đa ${experienceRange.maxExperience}`)
        return
      }
    }

    const payload: any = { ...editing }
    if (!editing._id) {
      if (!password) {
        toast.error('Mật khẩu là bắt buộc khi tạo mới')
        return
      }
      payload.password = password
    } else if (password) {
      payload.password = password
    }
    
    // If editing and level changed, include experience
    if (editing._id && originalLevel !== null && originalLevel !== editing.level) {
      payload.experience = editing.experience || experienceRange?.minExperience
    }

    try {
      if (editing._id) await api.put(`/admin/users/${editing._id}`, payload)
      else await api.post('/admin/users', payload)
      
      toast.success(editing._id ? 'Cập nhật thành công' : 'Thêm mới thành công')
      setEditing(null)
      setPassword('')
      setExperienceRange(null)
      setOriginalLevel(null)
      fetchUsers()
    } catch (error: any) { 
      toast.error(error.response?.data?.message || 'Lỗi khi lưu người dùng') 
    }
  }

  const handleLevelChange = async (newLevel: number) => {
    if (!editing) return
    const updatedEditing = { ...editing, level: newLevel }
    setEditing(updatedEditing)
    
    // If editing existing user and level changed, fetch experience range
    if (editing._id && (originalLevel === null || originalLevel !== newLevel)) {
      setLoadingRange(true)
      try {
        const response = await api.get(`/admin/level/${newLevel}/experience-range`)
        setExperienceRange(response.data)
        // Set experience to min if level changed
        if (originalLevel !== null && originalLevel !== newLevel) {
          setEditing({ ...updatedEditing, experience: response.data.minExperience })
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể lấy khoảng experience')
      } finally {
        setLoadingRange(false)
      }
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <UsersIcon className="w-6 h-6" />
             </div>
             Quản trị học viên
          </h1>
          <p className="text-gray-500 font-medium">Quản lý tài khoản, trình độ và tài sản của học viên trên hệ thống.</p>
        </div>
        
        <Button onClick={() => { 
          setEditing({ _id: '', name: '', email: '', level: 1, coins: 0, role: 'user' }); 
          setPassword('')
          setOriginalLevel(null)
          setExperienceRange(null)
        }} className="chinese-gradient h-11 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Plus className="mr-2 h-4 w-4" /> Thêm học viên mới
        </Button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={search} 
              onChange={e => { setPage(1); setSearch(e.target.value) }} 
              className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/20 transition-all font-medium" 
            />
         </div>
         
         <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
               <span className="text-[10px] font-black uppercase text-gray-400">Hiển thị</span>
               <Select value={pageSize.toString()} onValueChange={v => { setPageSize(parseInt(v)); setPage(1); }}>
                  <SelectTrigger className="w-24 h-12 rounded-xl border-gray-100 bg-gray-50 font-black text-sm">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100">
                     <SelectItem value="10">10 dòng</SelectItem>
                     <SelectItem value="20">20 dòng</SelectItem>
                     <SelectItem value="50">50 dòng</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            
            <Badge variant="outline" className="h-12 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 text-gray-400">
               Tổng số: {totalUsers} Học viên
            </Badge>
         </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Học viên</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Trình độ</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Tài sản (Xu)</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Vai trò</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className="group hover:bg-gray-50/30 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-2xl chinese-gradient flex items-center justify-center text-white font-black text-xl shadow-md transform group-hover:rotate-6 transition-transform">
                                {u.name ? u.name[0].toUpperCase() : '?'}
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{u.name}</p>
                                <p className="text-[11px] text-gray-400 font-medium">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <Badge className="bg-primary/5 text-primary border-none rounded-lg font-black text-[10px] px-3 py-1">
                             LEVEL {u.level}
                          </Badge>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center space-x-1.5 font-black text-amber-500">
                             <Coins className="w-4 h-4" />
                             <span>{u.coins.toLocaleString()}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <Badge className={`rounded-lg font-black text-[10px] px-3 py-1 border-none ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                             {u.role ? u.role.toUpperCase() : 'USER'}
                          </Badge>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => { 
                                 setEditing({ ...u }); 
                                 setPassword('')
                                 setOriginalLevel(u.level)
                                 setExperienceRange(null)
                               }} 
                               className="w-10 h-10 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                             >
                                <Edit className="w-4.5 h-4.5" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => setDeleteId(u._id)} 
                               className="w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                             >
                                <Trash2 className="w-4.5 h-4.5" />
                             </Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                       <td colSpan={5} className="px-8 py-20 text-center">
                          <p className="text-gray-400 font-bold italic">Không tìm thấy học viên nào phù hợp.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
           <Button 
             variant="ghost" 
             disabled={page === 1} 
             onClick={() => setPage(p => p - 1)} 
             className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary transition-colors"
           >
              Trang trước
           </Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {page} / {totalPages}
           </div>
           <Button 
             variant="ghost" 
             disabled={page === totalPages}
             onClick={() => setPage(p => p + 1)} 
             className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary transition-colors"
           >
              Trang sau
           </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => {
        if (!o) {
          setEditing(null)
          setPassword('')
          setExperienceRange(null)
          setOriginalLevel(null)
        }
      }}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black text-gray-900 flex items-center">
               <div className="w-12 h-12 chinese-gradient rounded-2xl flex items-center justify-center text-white mr-4 shadow-lg">
                  {editing?._id ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
               </div>
               {editing?._id ? 'Cập nhật học viên' : 'Thêm học viên mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveUser} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Họ và tên</Label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          value={editing?.name} 
                          onChange={e => setEditing({ ...editing!, name: e.target.value })} 
                          className="pl-11 h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                          placeholder="Nhập tên học viên..."
                          required 
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Địa chỉ Email</Label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="email"
                          value={editing?.email} 
                          onChange={e => setEditing({ ...editing!, email: e.target.value })} 
                          className="pl-11 h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                          placeholder="example@gmail.com"
                          required 
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vai trò hệ thống</Label>
                     <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                        <select 
                          className="w-full h-12 pl-11 pr-4 bg-gray-50/50 border-2 border-gray-50 rounded-xl font-bold text-sm text-gray-700 focus:bg-white focus:border-primary transition-all outline-none appearance-none" 
                          value={editing?.role || 'user'} 
                          onChange={e => setEditing({ ...editing!, role: e.target.value })}
                        >
                           <option value="user">User - Học viên</option>
                           <option value="admin">Admin - Quản trị viên</option>
                        </select>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cấp độ (Level)</Label>
                        <div className="relative">
                           <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input 
                             type="number" 
                             value={editing?.level} 
                             onChange={e => handleLevelChange(parseInt(e.target.value || '1'))} 
                             className="pl-11 h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-black text-primary" 
                             min="1"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tài sản (Xu)</Label>
                        <div className="relative">
                           <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <Input 
                             type="number" 
                             value={editing?.coins} 
                             onChange={e => setEditing({ ...editing!, coins: parseInt(e.target.value || '0') })} 
                             className="pl-11 h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-black text-amber-500" 
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Mật khẩu {editing?._id ? '(Để trống nếu không đổi)' : ''}
                     </Label>
                     <Input 
                       type="password" 
                       value={password} 
                       onChange={e => setPassword(e.target.value)} 
                       className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" 
                       placeholder="••••••••"
                       required={!editing?._id}
                     />
                  </div>

                  {/* Experience Adjustment Section */}
                  {(editing?._id && (originalLevel === null || originalLevel !== editing.level)) && experienceRange && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">Hiệu chỉnh điểm kinh nghiệm</p>
                       <p className="text-[11px] font-bold text-gray-500">
                          Khoảng XP cho Level {editing.level}: <span className="text-primary">{experienceRange.range}</span>
                       </p>
                       <Input 
                         type="number" 
                         min={experienceRange.minExperience}
                         max={experienceRange.maxExperience}
                         value={editing.experience || experienceRange.minExperience} 
                         onChange={e => setEditing({ ...editing!, experience: parseInt(e.target.value || '0') })} 
                         className="h-10 rounded-xl border-primary/20 bg-white font-black text-xs" 
                       />
                       <p className="text-[9px] text-gray-400 italic">
                          Hệ thống yêu cầu XP nằm trong khoảng trình độ mới để đảm bảo tính nhất quán của dữ liệu.
                       </p>
                    </div>
                  )}
                  {loadingRange && (
                    <div className="flex items-center justify-center p-4">
                       <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
               </div>
            </div>

            <div className="flex gap-4 pt-4">
               <Button 
                 type="button" 
                 variant="ghost" 
                 onClick={() => setEditing(null)} 
                 className="flex-1 h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-50"
               >
                  Hủy bỏ
               </Button>
               <Button 
                 type="submit" 
                 disabled={loadingRange}
                 className="flex-[2] h-14 rounded-2xl chinese-gradient font-black text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
               >
                  {loadingRange ? 'Đang kiểm tra...' : (editing?._id ? 'Cập nhật thay đổi' : 'Khởi tạo tài khoản')}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <Trash2 className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Xóa học viên?</DialogTitle>
            <p className="text-sm font-medium text-gray-500">
               Hành động này sẽ gỡ bỏ hoàn toàn tài khoản học viên và toàn bộ lịch sử học tập. Không thể hoàn tác.
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button 
              onClick={async () => { 
                if (deleteId) { 
                  try {
                    await api.delete(`/admin/users/${deleteId}`)
                    toast.success('Đã xóa học viên')
                    setDeleteId(null)
                    fetchUsers()
                  } catch (e: any) {
                    toast.error(e.response?.data?.message || 'Lỗi khi xóa')
                  }
                } 
              }} 
              className="h-14 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200"
            >
               Xác nhận xóa vĩnh viễn
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setDeleteId(null)} 
              className="h-14 rounded-2xl font-bold text-gray-400"
            >
               Hủy bỏ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminUsers