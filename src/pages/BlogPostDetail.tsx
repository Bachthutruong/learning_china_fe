import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Clock,
  Tag
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

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

export const BlogPostDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/blog-posts/${id}`)
      setPost(response.data)
    } catch (error: any) {
      console.error('Error fetching blog post:', error)
      toast.error('Không thể tải bài viết')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">Không tìm thấy bài viết</p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại bản tin
        </Button>

        <article className="space-y-10">
          {/* Header Section */}
          <div className="space-y-6">
             <div className="flex items-center space-x-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                   Jiudi Blog
                </Badge>
                {post.tags?.[0] && (
                  <Badge variant="outline" className="text-[10px] font-bold uppercase text-gray-400 rounded-lg">
                     {post.tags[0]}
                  </Badge>
                )}
             </div>
             
             <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                {post.title}
             </h1>

             {post.excerpt && (
               <p className="text-xl text-gray-500 font-medium leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2">
                  {post.excerpt}
               </p>
             )}

             <div className="flex flex-wrap items-center gap-y-4 gap-x-8 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full chinese-gradient flex items-center justify-center text-white font-black shadow-lg">
                      {post.author.name[0].toUpperCase()}
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Tác giả</p>
                      <p className="text-sm font-bold text-gray-700">{post.author.name}</p>
                   </div>
                </div>

                <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-primary" /> {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Draft'}</div>
                   <div className="flex items-center"><Eye className="w-4 h-4 mr-2 text-primary" /> {post.views.toLocaleString()} Lượt xem</div>
                   <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> {Math.ceil(post.content.replace(/<[^>]*>/g, '').length / 1000)} Phút đọc</div>
                </div>
             </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100 aspect-video">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Card */}
          <div className="bg-white rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-[1.8] prose-p:font-medium prose-strong:text-primary prose-a:text-primary prose-img:rounded-[2rem] prose-img:shadow-2xl">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
             </div>

             {/* Footer Tags */}
             {post.tags && post.tags.length > 0 && (
               <div className="mt-16 pt-8 border-t border-gray-50 flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 mr-2 flex items-center"><Tag className="w-3 h-3 mr-1" /> Thẻ bài viết:</span>
                  {post.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-50 text-gray-500 border-none rounded-lg px-3 py-1 font-bold text-xs hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                      #{tag}
                    </Badge>
                  ))}
               </div>
             )}
          </div>

          {/* Engagement Section */}
          <div className="bg-gray-900 rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden group text-center space-y-6">
             <div className="absolute inset-0 chinese-gradient opacity-10" />
             <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black">Thấy bài viết này hữu ích?</h3>
                <p className="text-gray-400 font-medium max-w-lg mx-auto">Hãy chia sẻ cho bạn bè cùng học hoặc để lại bình luận góp ý để Jiudi hoàn thiện hơn mỗi ngày.</p>
                <div className="flex justify-center gap-4 pt-4">
                   <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-black h-12 px-8">Chia sẻ ngay</Button>
                   <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 rounded-xl h-12 px-8 font-black">Lưu bài viết</Button>
                </div>
             </div>
          </div>
        </article>
      </div>
    </div>
  )
}