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
import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const AdminHeader = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications] = useState(5) // Mock notification count

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh hệ thống..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black rounded-lg h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white">
                {notifications}
              </span>
            )}
          </Button>

          <div className="w-px h-6 bg-gray-100" />

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


