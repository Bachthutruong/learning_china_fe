import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Loader2, CheckCircle, XCircle, Settings, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface Contribution {
  _id: string
  vocabularyId: { _id: string, word: string }
  contributorId: { _id: string, name: string, email: string }
  content: string
  editedContent?: string
  isAnonymous: boolean
  status: 'pending' | 'approved' | 'rejected'
  reviewerId?: { _id: string, name: string, email: string }
  createdAt: string
  updatedAt: string
}

export const ExampleContributions = () => {
  const { user: currentUser } = useAuth()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const [editingContent, setEditingContent] = useState('')
  const [currentContribution, setCurrentContribution] = useState<Contribution | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchContributions()
  }, [statusFilter, page, limit])

  const fetchContributions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/vocabulary-examples/admin', {
        params: { status: statusFilter === 'all' ? '' : statusFilter, limit, page }
      })
      setContributions(res.data.contributions)
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
    } catch (error) {
      console.error('Lỗi tải danh sách ví dụ đóng góp', error)
      toast.error('Không thể tải danh sách')
    } finally {
      setLoading(false)
    }
  }



  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/vocabulary-examples/admin/review/${id}`, { status })
      toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} thành công`)
      fetchContributions()
    } catch (error) {
      console.error('Lỗi duyệt hệ thống', error)
      toast.error('Lỗi thao tác')
    }
  }

  const handleEditAndApprove = async () => {
    if (!currentContribution) return
    try {
      await api.put(`/vocabulary-examples/admin/review/${currentContribution._id}`, {
        status: 'approved',
        editedContent: editingContent
      })
      toast.success('Đã sửa và duyệt thành công')
      setShowEditDialog(false)
      fetchContributions()
    } catch (error) {
      console.error('Lỗi duyệt', error)
      toast.error('Lỗi thao tác')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 border-b-2 border-primary pb-2 inline-block">
            Kiểm duyệt ví dụ từ vựng
          </h2>
          <p className="text-muted-foreground mt-2">
            Xem và xử lý các đóng góp ví dụ của cộng đồng.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/admin/example-reward-config'} className="gap-2">
              <Settings className="w-4 h-4" /> Cài đặt thưởng
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle>Danh sách chờ duyệt</CardTitle>
            <div className="flex gap-4">
              <select 
                value={limit} 
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="border border-gray-300 rounded-lg text-sm p-2 focus:ring-primary focus:border-primary"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-300 rounded-lg text-sm p-2 focus:ring-primary focus:border-primary"
              >
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Bị từ chối</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Không có dữ liệu đóng góp.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Từ vựng</TableHead>
                      <TableHead className="w-[300px]">Nội dung ví dụ</TableHead>
                      <TableHead>Người đóng góp</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead>Người duyệt</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-bold text-primary">{c.vocabularyId?.word || '??'}</TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-800 line-clamp-2">{c.editedContent || c.content}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{c.contributorId?.name || 'User'}</span>
                            {c.isAnonymous && <Badge variant="outline" className="text-[10px] w-fit mt-1 text-gray-400">Ẩn danh</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{c.reviewerId?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'pending' ? 'secondary' : c.status === 'approved' ? 'default' : 'destructive'}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                onClick={() => handleReview(c._id, 'approved')} 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600 h-8 px-2"
                                title="Duyệt"
                              >
                                <CheckCircle className="w-4 h-4"/>
                              </Button>
                              <Button 
                                onClick={() => {
                                  setCurrentContribution(c)
                                  setEditingContent(c.editedContent || c.content)
                                  setShowEditDialog(true)
                                }} 
                                size="sm" 
                                variant="outline"
                                className="h-8 px-2"
                                title="Sửa"
                              >
                                <Edit3 className="w-4 h-4"/>
                              </Button>
                              <Button 
                                onClick={() => handleReview(c._id, 'rejected')} 
                                size="sm" 
                                variant="destructive"
                                className="h-8 px-2"
                                title="Từ chối"
                              >
                                <XCircle className="w-4 h-4"/>
                              </Button>
                            </div>
                          )}
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



      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa và Duyệt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nội dung câu ví dụ</Label>
              <textarea 
                className="w-full min-h-[100px] border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
              />
            </div>
            <Button onClick={handleEditAndApprove} className="w-full bg-green-500 hover:bg-green-600">Lưu và Duyệt</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
