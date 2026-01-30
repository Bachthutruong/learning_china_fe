import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  Save, 
  X,
  Upload,
  // Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// interface BlogPost {
//   _id: string
//   title: string
//   content: string
//   excerpt?: string
//   featuredImage?: string
//   status: 'draft' | 'published'
//   tags?: string[]
// }

export const BlogPostForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!id)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/blog-posts/admin/${id}`)
      const post = response.data.post || response.data
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setFeaturedImage(post.featuredImage || '')
      setStatus(post.status)
      setTags(post.tags || [])
    } catch (error: any) {
      console.error('Error fetching blog post:', error)
      toast.error('Không thể tải bài viết')
      navigate('/admin/blog-posts')
    } finally {
      setFetching(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url || response.data.imageUrl || response.data.path
    } catch (error: any) {
      console.error('Error uploading image:', error)
      throw new Error('Không thể tải ảnh lên')
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      setImageFile(file)
      const imageUrl = await handleImageUpload(file)
      setFeaturedImage(imageUrl)
      toast.success('Tải ảnh thành công')
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải ảnh lên')
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('excerpt', excerpt)
      formData.append('status', status)
      formData.append('tags', JSON.stringify(tags))
      
      if (featuredImage && !imageFile) {
        formData.append('featuredImage', featuredImage)
      }

      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (id) {
        await api.put(`/blog-posts/admin/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        toast.success('Cập nhật bài viết thành công')
      } else {
        await api.post('/blog-posts/admin', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        toast.success('Tạo bài viết thành công')
      }

      navigate('/admin/blog-posts')
    } catch (error: any) {
      console.error('Error saving blog post:', error)
      toast.error(error.response?.data?.message || 'Không thể lưu bài viết')
    } finally {
      setLoading(false)
    }
  }

  // Create a ref for Quill instance
  const quillRef = useRef<any>(null)

  // Memoize modules to prevent re-renders
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function(this: any) {
          const quill = this.quill
          
          // Get current selection or use end of document
          let range = quill.getSelection()
          if (!range) {
            // If no selection, place cursor at end
            const length = quill.getLength()
            range = { index: length - 1, length: 0 }
          }
          
          const input = document.createElement('input')
          input.setAttribute('type', 'file')
          input.setAttribute('accept', 'image/*')
          
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return

            // Validate file
            if (!file.type.startsWith('image/')) {
              toast.error('Vui lòng chọn file ảnh')
              return
            }

            if (file.size > 5 * 1024 * 1024) {
              toast.error('Kích thước ảnh không được vượt quá 5MB')
              return
            }

            try {
              // Show loading
              toast.loading('Đang tải ảnh lên...', { id: 'upload-image' })
              
              // Upload image using the handleImageUpload function
              const formData = new FormData()
              formData.append('image', file)

              const response = await api.post('/upload/image', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })

              const imageUrl = response.data.url || response.data.imageUrl || response.data.path
              
              // Get current selection again (in case user moved cursor)
              let currentRange = quill.getSelection()
              if (!currentRange) {
                // If still no selection, use saved range or end of document
                currentRange = range
                if (!currentRange) {
                  const length = quill.getLength()
                  currentRange = { index: length - 1, length: 0 }
                }
              }
              
              // Insert image at cursor position
              quill.insertEmbed(currentRange.index, 'image', imageUrl)
              
              // Move cursor after image
              quill.setSelection(currentRange.index + 1, 0)
              
              toast.success('Chèn ảnh thành công', { id: 'upload-image' })
            } catch (error: any) {
              toast.error(error.message || 'Không thể tải ảnh lên', { id: 'upload-image' })
            }
          }
          
          input.click()
        }
      }
    }
  }), [])

  const quillFormats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image'
  ], [])

  if (fetching) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {id ? 'Biên tập bài viết' : 'Khởi tạo bản thảo'}
          </h1>
          <p className="text-gray-500 font-medium">Sáng tạo nội dung chất lượng cao cho cộng đồng Jiudi Learning.</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/blog-posts')}
            className="rounded-xl font-bold border-gray-200 h-11 px-6"
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={loading} className="chinese-gradient h-11 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu bài viết
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Content */}
          <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tiêu đề bài viết</Label>
                   <Input
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Ví dụ: Lộ trình chinh phục HSK 6 trong 6 tháng..."
                     className="h-14 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-black text-xl"
                     required
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nội dung chi tiết</Label>
                   <div className="min-h-[500px] rounded-2xl border-2 border-gray-50 overflow-hidden bg-white" id="quill-editor-wrapper">
                      <ReactQuill
                        key="blog-editor"
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={(value) => setContent(value)}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Bắt đầu viết nội dung tại đây..."
                        style={{ minHeight: '450px' }}
                        className="blog-editor"
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-4">
             <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả ngắn (Excerpt)</Label>
             <Textarea
               value={excerpt}
               onChange={(e) => setExcerpt(e.target.value)}
               placeholder="Tóm tắt ngắn gọn nội dung bài viết để thu hút người đọc..."
               className="min-h-[120px] rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium"
               rows={4}
             />
          </div>
        </div>

        <div className="space-y-8">
          {/* Publishing Options */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-4">Thiết lập xuất bản</h3>
             
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Trạng thái</Label>
                   <Select value={status} onValueChange={(v: 'draft' | 'published') => setStatus(v)}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-100 font-bold bg-gray-50/50">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                         <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                         <SelectItem value="published">Xuất bản (Live)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Gắn thẻ (Tags)</Label>
                   <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="HSK, Mẹo học..."
                        className="h-10 rounded-lg bg-gray-50 border-gray-100 font-bold text-xs"
                      />
                      <Button type="button" onClick={handleAddTag} className="bg-gray-900 text-white rounded-lg h-10 px-4 font-black text-xs">Thêm</Button>
                   </div>
                   <div className="flex flex-wrap gap-1.5 pt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} className="bg-primary/5 text-primary border-none rounded-lg px-2 py-1 text-[9px] font-black flex items-center gap-1 group">
                           {tag}
                           <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500" onClick={() => handleRemoveTag(tag)} />
                        </Badge>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Media Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-4">Ảnh bìa (Featured)</h3>
             
             {featuredImage ? (
               <div className="relative aspect-video rounded-2xl overflow-hidden group border-4 border-white shadow-xl ring-1 ring-gray-100">
                  <img src={featuredImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Button type="button" variant="destructive" size="sm" onClick={() => { setFeaturedImage(''); setImageFile(null); }} className="rounded-xl h-9 px-4 font-black text-[10px] uppercase">Gỡ bỏ ảnh</Button>
                  </div>
               </div>
             ) : (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-video rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 hover:border-primary/30 hover:bg-white transition-all flex flex-col items-center justify-center cursor-pointer group"
               >
                  <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-[10px] font-black uppercase text-gray-400">Chọn ảnh tiêu biểu</p>
               </div>
             )}
             <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
             <p className="text-[9px] font-bold text-gray-400 italic text-center">Định dạng JPG, PNG. Tối đa 5MB.</p>
          </div>
        </div>
      </div>
    </form>
  )
}

