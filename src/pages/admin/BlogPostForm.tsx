import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
// import { Label } from '../../components/ui/label'
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p className="text-gray-600 mt-1">
              {id ? 'Cập nhật thông tin bài viết' : 'Tạo một bài viết blog mới'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/blog-posts')}
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle>Tiêu đề</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết..."
                  required
                />
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Nội dung</CardTitle>
                <CardDescription>
                  Nhập nội dung bài viết. Bạn có thể chèn ảnh vào bất kỳ vị trí nào bằng cách click vào biểu tượng ảnh trên thanh công cụ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[500px] mb-4" id="quill-editor-wrapper">
                  <ReactQuill
                    key="blog-editor"
                    ref={quillRef}
                    theme="snow"
                    value={content}
                    onChange={(value) => {
                      setContent(value)
                    }}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Nhập nội dung bài viết..."
                    style={{ 
                      minHeight: '400px',
                      backgroundColor: 'white'
                    }}
                    className="blog-editor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Mô tả ngắn</CardTitle>
                <CardDescription>
                  Tóm tắt ngắn gọn về bài viết (tùy chọn)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Nhập mô tả ngắn..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {featuredImage && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setFeaturedImage('')
                        setImageFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {featuredImage ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="published">Đã xuất bản</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Thẻ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Thêm thẻ..."
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Thêm
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  )
}

