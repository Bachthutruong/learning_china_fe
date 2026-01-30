import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  FileText,
  // ChevronLeft,
  // ChevronRight,
  Loader2
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

interface BlogPost {
  _id: string
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  author: {
    _id: string
    name: string
    email: string
  }
  status: 'draft' | 'published'
  publishedAt?: string
  views: number
  tags?: string[]
  slug?: string
  createdAt: string
  updatedAt: string
}

export const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params: any = { 
        page: page.toString(), 
        limit: limit.toString() 
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await api.get('/blog-posts/admin/all', { params })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.totalPages || 1)
      setTotal(response.data.total || 0)
    } catch (error: any) {
      console.error('Error fetching blog posts:', error)
      toast.error('Không thể tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, limit, statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchPosts()
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleDelete = async () => {
    if (!postToDelete) return

    try {
      await api.delete(`/blog-posts/admin/${postToDelete}`)
      toast.success('Xóa bài viết thành công')
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      fetchPosts()
    } catch (error: any) {
      console.error('Error deleting blog post:', error)
      toast.error('Không thể xóa bài viết')
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <FileText className="w-6 h-6" />
             </div>
             Quản trị Blog
          </h1>
          <p className="text-gray-500 font-medium">Sáng tạo và quản lý nội dung bản tin, kinh nghiệm học tập Hán ngữ.</p>
        </div>
        
        <Button onClick={() => navigate('/admin/blog-posts/new')} className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Plus className="mr-2 h-4 w-4" /> Viết bài mới
        </Button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
               <Input
                 placeholder="Tìm kiếm theo tiêu đề bài viết hoặc tác giả..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="h-12 pl-11 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
               />
            </div>
            
            <div className="flex items-center gap-4">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 h-12 rounded-xl border-gray-100 font-bold bg-gray-50/50">
                     <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">Tất cả bài viết</SelectItem>
                     <SelectItem value="published">Đã xuất bản</SelectItem>
                     <SelectItem value="draft">Bản nháp</SelectItem>
                  </SelectContent>
               </Select>

               <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">Trang</span>
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                     <SelectTrigger className="w-20 h-10 rounded-xl border-gray-100 font-black text-[10px]">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
         </div>
      </div>

      {/* Posts List Rendering */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Đang truy xuất bản thảo...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <FileText className="w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Chưa có bài viết nào</h3>
              <p className="text-gray-500 font-medium">Bắt đầu chia sẻ kiến thức của bạn ngay hôm nay.</p>
           </div>
           <Button onClick={() => navigate('/admin/blog-posts/new')} className="chinese-gradient h-12 px-8 rounded-xl font-black text-white">Viết bài đầu tiên</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col md:flex-row gap-8 items-center">
               {post.featuredImage && (
                 <div className="w-full md:w-48 h-40 shrink-0 rounded-[2rem] overflow-hidden border-2 border-white shadow-lg ring-1 ring-gray-100">
                    <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 </div>
               )}
               
               <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                     <Badge className={`rounded-lg font-black uppercase text-[8px] tracking-widest ${post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {post.status === 'published' ? 'Live' : 'Draft'}
                     </Badge>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">{post.title}</h3>
                     <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {post.excerpt || stripHtml(post.content).substring(0, 150) + '...'}
                     </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                           <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">{post.author.name[0]}</div>
                           <span>{post.author.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                           <Eye className="w-4 h-4 text-primary" />
                           <span>{post.views.toLocaleString()}</span>
                        </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/blog-posts/${post._id}`)} className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setPostToDelete(post._id); setDeleteDialogOpen(true); }} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8">
           <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trước</Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {page} / {totalPages}
           </div>
           <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Tiếp</Button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <Trash2 className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Xóa bài viết?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500 leading-relaxed">
               Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={handleDelete} className="h-12 rounded-xl font-black text-white shadow-lg bg-red-500 hover:bg-red-600">Đồng ý xóa</Button>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="h-12 rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Footer Info */}
      <div className="mt-8 text-center">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Hiển thị {posts.length} trong tổng số {total} bài viết</p>
      </div>
    </div>
  )
}

