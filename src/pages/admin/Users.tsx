import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface UserItem {
  _id: string
  name: string
  email: string
  level: number
  experience?: number
  coins: number
  role?: string
}

interface ExperienceRange {
  level: number
  minExperience: number
  maxExperience?: number
  range: string
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
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
      console.log('res', res.data)
      setUsers(res.data?.users || res.data || [])
    } catch {
      setUsers([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Tìm tên/email" value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} className="w-64" />
          <Button onClick={() => { 
            setEditing({ _id: '', name: '', email: '', level: 1, coins: 0, role: 'user' }); 
            setPassword('')
            setOriginalLevel(null)
            setExperienceRange(null)
          }}>Thêm</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Danh sách</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Tên</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Cấp</th>
                  <th className="py-2 pr-4">Xu</th>
                  <th className="py-2 pr-4">Quyền</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className="border-t">
                    <td className="py-2 pr-4">{(page - 1) * pageSize + i + 1}</td>
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4"><Badge variant="secondary">Lv.{u.level}</Badge></td>
                    <td className="py-2 pr-4">{u.coins}</td>
                    <td className="py-2 pr-4">{u.role || 'user'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { 
                          setEditing({ ...u, experience: (u as any).experience }); 
                          setPassword('')
                          setOriginalLevel(u.level)
                          setExperienceRange(null)
                        }}>Sửa</Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(u._id)}>Xóa</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">Không có người dùng</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <label className="text-gray-600">Hiển thị</label>
              <select className="border rounded px-2 py-1" value={pageSize} onChange={e => { setPage(1); setPageSize(parseInt(e.target.value)) }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
              <Badge variant="outline">Trang {page}</Badge>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { 
        if (!open) {
          setEditing(null)
          setPassword('')
          setExperienceRange(null)
          setOriginalLevel(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <UIDialogHeader><UIDialogTitle>{editing?._id ? 'Sửa người dùng' : 'Thêm người dùng'}</UIDialogTitle></UIDialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Tên</label>
                <Input value={editing.name} onChange={e => setEditing({ ...(editing as any), name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <Input value={editing.email} onChange={e => setEditing({ ...(editing as any), email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Cấp</label>
                  <Input 
                    type="number" 
                    value={editing.level} 
                    onChange={async (e) => {
                      const newLevel = parseInt(e.target.value || '1')
                      const updatedEditing = { ...(editing as any), level: newLevel }
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
                    }} 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Xu</label>
                  <Input type="number" value={editing.coins} onChange={e => setEditing({ ...(editing as any), coins: parseInt(e.target.value || '0') })} />
                </div>
              </div>
              {(editing._id && (originalLevel === null || originalLevel !== editing.level)) && experienceRange && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800 font-medium mb-2">
                    Khoảng Experience cho Level {editing.level}: {experienceRange.range}
                  </p>
                  <div>
                    <label className="text-xs text-gray-500">Experience *</label>
                    <Input 
                      type="number" 
                      min={experienceRange.minExperience}
                      max={experienceRange.maxExperience}
                      value={editing.experience || experienceRange.minExperience} 
                      onChange={e => {
                        const exp = parseInt(e.target.value || String(experienceRange.minExperience))
                        setEditing({ ...(editing as any), experience: exp })
                      }} 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối thiểu: {experienceRange.minExperience}
                      {experienceRange.maxExperience !== undefined && `, Tối đa: ${experienceRange.maxExperience}`}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500">Quyền</label>
                <select className="border rounded px-2 py-2 w-full" value={editing.role || 'user'} onChange={e => setEditing({ ...(editing as any), role: e.target.value })}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mật khẩu {editing._id ? '(để trống nếu không đổi)' : ''}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditing(null)
              setPassword('')
              setExperienceRange(null)
              setOriginalLevel(null)
            }}>Hủy</Button>
            <Button onClick={async () => {
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
              if (!editing._id) payload.password = password
              else if (password) payload.password = password
              
              // If editing and level changed, include experience
              if (editing._id && originalLevel !== null && originalLevel !== editing.level) {
                payload.experience = editing.experience || experienceRange?.minExperience
              }
              
              try {
                if (editing._id) await api.put(`/admin/users/${editing._id}`, payload)
                else await api.post('/admin/users', payload)
                toast.success(editing._id ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công')
                setEditing(null)
                setPassword('')
                setExperienceRange(null)
                setOriginalLevel(null)
                fetchUsers()
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
              }
            }} disabled={loadingRange}>
              {loadingRange ? 'Đang tải...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <UIDialogHeader><UIDialogTitle>Xóa người dùng</UIDialogTitle></UIDialogHeader>
          <p className="text-sm text-gray-600">Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={async () => { if (deleteId) { await api.delete(`/admin/users/${deleteId}`); setDeleteId(null); fetchUsers() } }}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


