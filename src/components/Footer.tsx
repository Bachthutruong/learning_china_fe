import { Link } from 'react-router-dom'
import { Button } from './ui/button'
// import { Card, CardContent } from './ui/card'
import { 
  BookOpen, 
  TestTube, 
  Trophy, 
  Brain, 
  Store, 
  User,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Học từ vựng', href: '/vocabulary', icon: BookOpen },
    { name: 'Bài test', href: '/tests', icon: TestTube },
    { name: 'Test năng lực', href: '/proficiency', icon: Brain },
    { name: 'Cuộc thi', href: '/competition', icon: Trophy },
    { name: 'Cửa hàng', href: '/store', icon: Store },
    { name: 'Hồ sơ', href: '/profile', icon: User }
  ]

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'YouTube', href: '#', icon: Youtube }
  ]

  return (
    <footer className="bg-[#1a1a1a] text-white overflow-hidden relative">
      {/* Decorative element */}
      <div className="absolute top-0 left-0 w-full h-1 chinese-gradient opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo and Description */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <span className="text-white font-bold text-xl">學</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white">
                  Jiudi Learning
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                  Chinese Education
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Nền tảng học tiếng Trung thế hệ mới, kết hợp công nghệ AI và phương pháp sư phạm hiện đại giúp bạn làm chủ Hán ngữ.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary hover:text-white transition-all duration-300"
                    asChild
                  >
                    <a href={social.href} aria-label={social.name}>
                      <Icon className="h-5 w-5" />
                    </a>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              Khám phá
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{link.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              Hỗ trợ
            </h3>
            <ul className="space-y-4">
              {[
                { name: 'Trung tâm trợ giúp', href: '/help' },
                { name: 'Câu hỏi thường gặp', href: '/faq' },
                { name: 'Liên hệ chúng tôi', href: '/contact' },
                { name: 'Góp ý dịch vụ', href: '/feedback' }
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors hover:translate-x-1 inline-block transform"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              Thông tin liên hệ
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                  <p className="text-sm text-gray-300">support@jiudilearning.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Hotline</p>
                  <p className="text-sm text-gray-300">+84 987 654 321</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Văn phòng</p>
                  <p className="text-sm text-gray-300">Cầu Giấy, Hà Nội, Việt Nam</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/5 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs font-medium">
              © {currentYear} Jiudi Learning. All rights reserved. Made with ❤️ for Chinese Learners.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/privacy" className="text-gray-500 hover:text-white text-xs font-medium transition-colors">
                Bảo mật
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-white text-xs font-medium transition-colors">
                Điều khoản
              </Link>
              <Link to="/cookies" className="text-gray-500 hover:text-white text-xs font-medium transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
