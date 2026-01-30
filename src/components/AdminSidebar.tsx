import { useState, useEffect } from 'react'
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
  // Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  // BarChart3,
  // FileText,
  Layers,
  Target,
  Coins,
  BookOpenCheck,
  Settings,
  CreditCard,
  Award,
  FileText
} from 'lucide-react'
import { api } from '../services/api'

interface MenuItem {
  title: string
  icon: any
  href: string
  badge: string | null
  submenu?: MenuItem[]
}

interface AdminSidebarProps {
  className?: string
  onStatsUpdate?: () => void
}

export const AdminSidebar = ({ className, onStatsUpdate }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    reports: 0,
    vocabularies: 0,
    topics: 0,
    levels: 0,
    tests: 0,
    proficiencyTests: 0,
    competitions: 0,
    users: 0,
    coinPurchases: 0
  })
  const location = useLocation()

  const fetchStats = async () => {
    try {
      const [reportsRes, vocabulariesRes, topicsRes, levelsRes, testsRes, proficiencyRes, competitionsRes, usersRes, coinPurchasesRes] = await Promise.all([
        api.get('/reports/admin/all'),
        api.get('/admin/vocabularies'),
        api.get('/admin/topics'),
        api.get('/admin/levels'),
        api.get('/admin/tests'),
        api.get('/admin/proficiency-tests'),
        api.get('/admin/competitions'),
        api.get('/admin/users'),
        api.get('/coin-purchases/admin/pending')
      ])

      setStats({
        reports: reportsRes.data?.total || reportsRes.data?.reports?.length || 0,
        vocabularies: vocabulariesRes.data?.total || vocabulariesRes.data?.vocabularies?.length || 0,
        topics: topicsRes.data?.total || topicsRes.data?.topics?.length || 0,
        levels: levelsRes.data?.total || levelsRes.data?.levels?.length || 0,
        tests: testsRes.data?.total || testsRes.data?.tests?.length || 0,
        proficiencyTests: proficiencyRes.data?.total || proficiencyRes.data?.proficiencyTests?.length || 0,
        competitions: competitionsRes.data?.total || competitionsRes.data?.competitions?.length || 0,
        users: usersRes.data?.total || usersRes.data?.users?.length || 0,
        coinPurchases: coinPurchasesRes.data?.total || coinPurchasesRes.data?.purchases?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Listen for stats updates from parent components
  useEffect(() => {
    if (onStatsUpdate) {
      fetchStats()
    }
  }, [onStatsUpdate])

  const menuItems: MenuItem[] = [
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
      badge: stats.reports > 0 ? stats.reports.toString() : null
    },
    {
      title: 'Từ vựng',
      icon: BookOpen,
      href: '/admin/vocabulary',
      badge: stats.vocabularies > 0 ? stats.vocabularies.toString() : null
    },
    {
      title: 'Chủ đề',
      icon: Layers,
      href: '/admin/topics',
      badge: stats.topics > 0 ? stats.topics.toString() : null
    },
    {
      title: 'Cấp độ',
      icon: Target,
      href: '/admin/levels',
      badge: stats.levels > 0 ? stats.levels.toString() : null
    },
    {
      title: 'Bài test',
      icon: TestTube,
      href: '/admin/tests',
      badge: stats.tests > 0 ? stats.tests.toString() : null
    },
    {
      title: 'Lịch sử làm bài test',
      icon: TestTube,
      href: '/admin/test-histories',
      badge: null
    },
    {
      title: 'Test năng lực',
      icon: Brain,
      href: '/admin/proficiency',
      badge: stats.proficiencyTests > 0 ? stats.proficiencyTests.toString() : null,
      submenu: [
        {
          title: 'Cấu hình Test',
          icon: Brain,
          href: '/admin/proficiency',
          badge: null
        },
        {
          title: 'Tạo/Chỉnh sửa',
          icon: Settings,
          href: '/admin/proficiency-config/new',
          badge: null
        },
        {
          title: 'Quản lý câu hỏi',
          icon: BookOpenCheck,
          href: '/admin/proficiency-questions',
          badge: null
        }
      ]
    },
    {
      title: 'Cuộc thi',
      icon: Trophy,
      href: '/admin/competitions',
      badge: stats.competitions > 0 ? stats.competitions.toString() : null
    },
    {
      title: 'Người dùng',
      icon: Users,
      href: '/admin/users',
      badge: stats.users > 0 ? stats.users.toString() : null
    },
    {
      title: 'Blog',
      icon: FileText,
      href: '/admin/blog-posts',
      badge: null
    },
    {
      title: 'Mua xu',
      icon: Coins,
      href: '/admin/coin-purchases',
      badge: stats.coinPurchases > 0 ? stats.coinPurchases.toString() : null
    },
    {
      title: 'Giao dịch XU',
      icon: Coins,
      href: '/admin/coin-transactions',
      badge: null
    },
    {
      title: 'Cấu hình thanh toán',
      icon: CreditCard,
      href: '/admin/payment-config',
      badge: null
    },
    {
      title: 'Cuộc thi người dùng',
      icon: Trophy,
      href: '#',
      badge: null,
      submenu: [
        {
          title: 'Cấu hình logic điểm',
          icon: Award,
          href: '/admin/competition-scoring-config',
          badge: null
        },
        {
          title: 'Cấu hình thưởng xếp hạng',
          icon: Coins,
          href: '/admin/competition-rewards-config',
          badge: null
        }
      ]
    },
    // {
    //   title: 'Thống kê',
    //   icon: BarChart3,
    //   href: '/admin/analytics',
    //   badge: null
    // },
    // {
    //   title: 'Cài đặt',
    //   icon: Settings,
    //   href: '/admin/settings',
    //   badge: null
    // }
  ]

  const toggleMenu = (menuKey: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey)
    } else {
      newExpanded.add(menuKey)
    }
    setExpandedMenus(newExpanded)
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname === href
  }

  return (
    <div className={`bg-[#1a1a1a] flex flex-col transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-72'
    } ${className} h-screen sticky top-0 shadow-2xl z-50`}>
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <Link to="/admin" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <span className="text-white font-bold text-xl">學</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight">Admin Portal</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-black">Jiudi Learning</span>
              </div>
            </Link>
          )}
          {collapsed && (
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center shadow-lg mx-auto">
                <span className="text-white font-bold text-xl">學</span>
             </div>
          )}
        </div>
      </div>

      <div className="absolute -right-3 top-20">
         <Button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-full chinese-gradient p-0 border-2 border-white shadow-lg text-white hover:scale-110 transition-transform"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const hasSubmenu = item.submenu && item.submenu.length > 0
          const isExpanded = expandedMenus.has(item.href)
          
          return (
            <div key={item.href} className="space-y-1">
              {hasSubmenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.href)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                      isExpanded || active
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                    {!collapsed && (
                      <>
                        <span className="font-bold text-sm flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge className="bg-primary text-[10px] h-5 min-w-[20px] justify-center px-1 font-black">
                            {item.badge}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 opacity-50" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </>
                    )}
                  </button>
                  
                  {!collapsed && isExpanded && item.submenu && (
                    <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon
                        const subActive = isActive(subItem.href)
                        
                        return (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                              subActive
                                ? 'text-primary font-black'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <SubIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{subItem.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                    active
                      ? 'chinese-gradient text-white shadow-lg shadow-primary/20 font-black'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-300 font-bold'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge className={`${active ? 'bg-white text-primary' : 'bg-primary'} text-[10px] h-5 min-w-[20px] justify-center px-1 font-black`}>
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Version 2.4.0</p>
            <p className="text-xs font-bold text-gray-400">© 2026 Jiudi Learning</p>
          </div>
        </div>
      )}
    </div>
  )
}


