import { useState } from 'react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
import { Bell, Search, User, LogOut, Settings, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface AdminHeaderProps {
  onOpenMobileMenu?: () => void
}

export const AdminHeader = ({ onOpenMobileMenu }: AdminHeaderProps) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications] = useState(5) // Mock notification count

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile: nút mở menu quản trị | Desktop: ô tìm kiếm */}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          {onOpenMobileMenu ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl text-gray-700 hover:bg-primary/5 hover:text-primary"
                onClick={onOpenMobileMenu}
                aria-label="Mở menu quản trị"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <span className="font-bold text-gray-900 truncate">Menu quản trị</span>
            </>
          ) : (
            <span className="font-bold text-gray-900 truncate">Quản trị</span>
          )}
        </div>
        <div className="hidden lg:flex flex-1 max-w-xl">
          <div className="relative group w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh hệ thống..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Bên phải: Thông báo + User */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative w-10 h-10 min-w-10 min-h-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black rounded-lg h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white">
                {notifications}
              </span>
            )}
          </Button>

          <div className="w-px h-6 bg-gray-100 hidden sm:block" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 flex items-center space-x-3 px-2 rounded-xl hover:bg-gray-50 transition-all group">
                <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-gray-100 group-hover:border-primary transition-all">
                  <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start space-y-0.5">
                   <p className="text-xs font-black text-gray-900 leading-none">{user?.name || 'Admin Master'}</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">System Root</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl shadow-2xl border-gray-100" align="end" forceMount>
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black text-gray-900 leading-none">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-xs font-medium text-gray-400 truncate italic">
                    {user?.email || 'admin@jiudilearning.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2" />
              <div className="p-1 space-y-1">
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5" onClick={() => navigate('/profile')}>
                  <User className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Hồ sơ cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5" onClick={() => navigate('/admin/settings')}>
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Cài đặt hệ thống</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="mx-2" />
              <div className="p-1">
                <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-bold text-sm">Đăng xuất</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}


