import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  LayoutDashboard, 
  BookOpen, 
  TestTube, 
  Brain, 
  Trophy, 
  Flag, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  Layers,
  Target
} from 'lucide-react'

interface AdminSidebarProps {
  className?: string
}

export const AdminSidebar = ({ className }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const menuItems = [
    {
      title: 'Tổng quan',
      icon: LayoutDashboard,
      href: '/admin',
      badge: null
    },
    {
      title: 'Báo cáo',
      icon: Flag,
      href: '/admin/reports',
      badge: '12'
    },
    {
      title: 'Từ vựng',
      icon: BookOpen,
      href: '/admin/vocabulary',
      badge: null
    },
    {
      title: 'Chủ đề',
      icon: Layers,
      href: '/admin/topics',
      badge: null
    },
    {
      title: 'Cấp độ',
      icon: Target,
      href: '/admin/levels',
      badge: null
    },
    {
      title: 'Bài test',
      icon: TestTube,
      href: '/admin/tests',
      badge: null
    },
    {
      title: 'Test năng lực',
      icon: Brain,
      href: '/admin/proficiency',
      badge: null
    },
    {
      title: 'Cuộc thi',
      icon: Trophy,
      href: '/admin/competitions',
      badge: null
    },
    {
      title: 'Người dùng',
      icon: Users,
      href: '/admin/users',
      badge: null
    },
    {
      title: 'Thống kê',
      icon: BarChart3,
      href: '/admin/analytics',
      badge: null
    },
    {
      title: 'Cài đặt',
      icon: Settings,
      href: '/admin/settings',
      badge: null
    }
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">中</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">Quản trị hệ thống</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>Hệ thống quản trị</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      )}
    </div>
  )
}


