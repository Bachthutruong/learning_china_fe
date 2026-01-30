import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Menu, X, Home, BookOpen, TestTube, Brain, Trophy, 
  MoreHorizontal, Users, Coins, FileText, HelpCircle, MessageCircle, 
  LogOut, User, Settings, Calendar, GraduationCap, Zap, ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const mainNav = [
    { label: 'Từ vựng', path: '/vocabulary-learning', icon: BookOpen },
    { label: 'Luyện thi', path: '/tests', icon: TestTube },
    { label: 'Năng lực', path: '/proficiency', icon: Brain },
    { label: 'Đấu trường', path: '/competition', icon: Trophy },
  ]

  const secondaryNav = [
    { label: 'Thi đấu nhóm', path: '/user-competitions', icon: Users },
    { label: 'Nạp Xu', path: '/coin-purchase', icon: Coins },
    { label: 'Hỏi đáp', path: '/faq', icon: FileText },
    { label: 'Hỗ trợ', path: '/help-center', icon: HelpCircle },
    { label: 'Liên hệ', path: '/contact', icon: MessageCircle },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl chinese-gradient shadow-lg transition-transform group-hover:rotate-6">
                <span className="text-xl font-bold text-white">學</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-primary transition-colors">
                  Jiudi Learning
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Chinese Mastery
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  isActive('/') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="h-4 w-4" />
                Trang chủ
              </Link>
              
              {mainNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* "More" Dropdown for Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 rounded-xl px-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 data-[state=open]:bg-gray-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2 shadow-xl border-gray-100">
                  <DropdownMenuLabel className="text-xs font-black text-gray-400 uppercase tracking-widest px-3 py-2">Khám phá thêm</DropdownMenuLabel>
                  {secondaryNav.map((item) => (
                    <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="rounded-xl px-3 py-2.5 font-bold text-gray-600 cursor-pointer focus:text-primary focus:bg-primary/5">
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Desktop User Stats */}
                <div className="hidden xl:flex items-center gap-3 rounded-full border border-gray-100 bg-white/50 px-4 py-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5" title="Level hiện tại">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-gray-700">Lv.{user?.level || 1}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-1.5 text-amber-500" title="Số dư xu">
                    <Coins className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-bold text-gray-700">{user?.coins?.toLocaleString() || 0}</span>
                  </div>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-2xl p-0 ring-2 ring-transparent hover:ring-primary/20 transition-all overflow-hidden">
                      <Avatar className="h-full w-full">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-black text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 mt-2 p-2 rounded-[1.5rem] shadow-2xl border-gray-100" align="end">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-2xl mb-2">
                      <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary text-white font-black">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-black text-gray-900">{user?.name}</span>
                        <span className="truncate text-xs font-medium text-gray-500">{user?.email}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                       <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 uppercase">Xu tích lũy</p>
                          <p className="text-sm font-black text-amber-700 flex items-center justify-center gap-1"><Coins className="w-3 h-3 fill-current" /> {user?.coins}</p>
                       </div>
                       <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                          <p className="text-[10px] font-bold text-blue-600 uppercase">Kinh nghiệm</p>
                          <p className="text-sm font-black text-blue-700 flex items-center justify-center gap-1"><Zap className="w-3 h-3 fill-current" /> {user?.experience}</p>
                       </div>
                    </div>

                    <DropdownMenuItem className="rounded-xl px-4 py-3 font-bold text-gray-600 cursor-pointer focus:bg-gray-50" onClick={() => navigate('/dashboard')}>
                      <User className="mr-3 h-4 w-4 text-primary" /> Tổng quan
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-4 py-3 font-bold text-gray-600 cursor-pointer focus:bg-gray-50" onClick={() => navigate('/profile')}>
                      <Settings className="mr-3 h-4 w-4 text-primary" /> Thiết lập tài khoản
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-4 py-3 font-bold text-gray-600 cursor-pointer focus:bg-gray-50" onClick={() => navigate('/checkin')}>
                      <Calendar className="mr-3 h-4 w-4 text-primary" /> Điểm danh nhận quà
                    </DropdownMenuItem>
                    
                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator className="my-2 bg-gray-100" />
                        <DropdownMenuItem className="rounded-xl px-4 py-3 font-black text-white bg-gray-900 cursor-pointer focus:bg-black focus:text-white" onClick={() => navigate('/admin')}>
                          <GraduationCap className="mr-3 h-4 w-4" /> Quản trị viên
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator className="my-2 bg-gray-100" />
                    <DropdownMenuItem className="rounded-xl px-4 py-3 font-bold text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600" onClick={handleLogout}>
                      <LogOut className="mr-3 h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:flex rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Đăng nhập
                </Button>
                <Button onClick={() => navigate('/register')} className="rounded-xl chinese-gradient font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Đăng ký ngay
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl h-10 w-10 text-gray-600 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-2xl p-4 animate-in slide-in-from-top-5 duration-200 z-40 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400">Menu Chính</div>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive('/') ? 'bg-primary/5 text-primary' : 'text-gray-600 active:bg-gray-50'}`}>
              <Home className="h-5 w-5" /> Trang chủ
            </Link>
            {mainNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive(item.path) ? 'bg-primary/5 text-primary' : 'text-gray-600 active:bg-gray-50'}`}
              >
                <item.icon className="h-5 w-5" /> {item.label}
              </Link>
            ))}
            
            <div className="my-2 h-px bg-gray-100" />
            
            <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400">Khám phá</div>
            {secondaryNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive(item.path) ? 'bg-primary/5 text-primary' : 'text-gray-600 active:bg-gray-50'}`}
              >
                <item.icon className="h-5 w-5" /> {item.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="my-2 h-px bg-gray-100" />
                <Button variant="destructive" className="w-full rounded-xl h-12 font-black mt-4" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" /> Đăng xuất
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
