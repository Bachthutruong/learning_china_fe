import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    
    if (!email.includes('@')) {
      toast.error('Email không hợp lệ')
      return
    }
    
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    
    setIsLoading(true)
    
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login failed:', error)
      const message = error.response?.data?.message || 'Đăng nhập thất bại'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-gray-100">
        {/* Left Side: Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 chinese-gradient text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center space-x-3 mb-12 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <span className="text-primary font-bold text-xl">學</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Jiudi Learning</span>
            </Link>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-black leading-tight">
                Học Tiếng Trung <br /> Chưa Bao Giờ <br /> Dễ Đến Thế.
              </h2>
              <p className="text-white/80 text-lg leading-relaxed max-w-xs">
                Tham gia cùng hàng nghìn học viên và bắt đầu hành trình chinh phục Hán ngữ ngay hôm nay.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 pt-12">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
              <p className="italic text-sm mb-4">"Phương pháp lặp lại ngắt quãng và AI của Jiudi thực sự đã thay đổi cách tôi học từ vựng."</p>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=32" alt="User" />
                </div>
                <div>
                  <p className="text-xs font-bold">Minh Anh</p>
                  <p className="text-[10px] text-white/60 uppercase">Học viên HSK 5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="text-gray-500 hover:text-primary mb-6 -ml-4 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Đăng nhập</h1>
            <p className="text-gray-500">Mừng bạn quay trở lại với Jiudi Learning!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400">Email cá nhân</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400">Mật khẩu</Label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="text-sm text-gray-500 font-medium">
                Duy trì đăng nhập
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl chinese-gradient text-white text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : 'Đăng nhập ngay'}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary hover:underline font-black">
                Tham gia miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}