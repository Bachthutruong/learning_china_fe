import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Loader2, Search, Settings, ShieldCheck, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface UserItem {
  _id: string
  name: string
  email: string
  role: string
  isReviewer?: boolean
}

export const ExampleReviewers = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/users', { params: { page, limit: pageSize, search } })
      if (res.data) {
        setUsers(res.data.users || res.data || [])
        setTotalUsers(res.data.total || (res.data.users ? res.data.users.length : 0))
        setTotalPages(res.data.totalPages || 1)
      }
    } catch { 
      setUsers([]) 
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const toggleReviewerRole = async (user: UserItem) => {
    try {
      await api.put(`/admin/users/${user._id}`, { isReviewer: !user.isReviewer })
      toast.success(`Đã cập nhật quyền duyệt cho ${user.name}`)
      // Update local state to avoid full refetch
      setUsers(users.map(u => u._id === user._id ? { ...u, isReviewer: !u.isReviewer } : u))
    } catch (error) {
      console.error(error)
      toast.error('Cập nhật thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-4 items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 border-b-2 border-primary pb-2 inline-block">
            Cấu hình người kiểm duyệt
          </h2>
          <p className="text-muted-foreground mt-2">
            Chỉ định quyền duyệt đóng góp ví dụ cho người dùng.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <CardTitle>Danh sách người dùng</CardTitle>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Tìm kiếm Email hoặc Tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full sm:w-64"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
            <select 
              value={pageSize} 
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg text-sm p-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value={10}>10 người</option>
              <option value={20}>20 người</option>
              <option value={50}>50 người</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Không tìm thấy người dùng.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phân hệ</TableHead>
                      <TableHead className="text-center">Quyền duyệt Ví dụ</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-bold">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="uppercase">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.isReviewer ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold uppercase">
                              <ShieldCheck className="w-3 h-3 mr-1 inline" /> Có quyền
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 font-medium">
                              Không
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button 
                             onClick={() => toggleReviewerRole(u)} 
                             variant={u.isReviewer ? 'outline' : 'default'}
                             size="sm"
                             className={u.isReviewer ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700' : 'bg-green-600 hover:bg-green-700 text-white'}
                           >
                             {u.isReviewer ? (
                               <><ShieldAlert className="w-4 h-4 mr-2" /> Gỡ quyền</>
                             ) : (
                               <><ShieldCheck className="w-4 h-4 mr-2" /> Cấp quyền</>
                             )}
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="text-sm font-medium">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
