import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Cookie, 
  Settings, 
  Shield, 
  Eye,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react'
import { useState } from 'react'

const cookieTypes = [
  {
    id: 'essential',
    title: 'Cookies cần thiết',
    description: 'Cần thiết cho hoạt động cơ bản của website',
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    required: true,
    examples: [
      'Xác thực người dùng',
      'Bảo mật phiên đăng nhập',
      'Ghi nhớ tùy chọn cơ bản'
    ]
  },
  {
    id: 'analytics',
    title: 'Cookies phân tích',
    description: 'Giúp chúng tôi hiểu cách bạn sử dụng website',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    required: false,
    examples: [
      'Theo dõi lượt truy cập',
      'Phân tích hành vi người dùng',
      'Cải thiện hiệu suất'
    ]
  },
  {
    id: 'functional',
    title: 'Cookies chức năng',
    description: 'Cải thiện trải nghiệm người dùng',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    required: false,
    examples: [
      'Ghi nhớ ngôn ngữ',
      'Lưu tùy chọn cá nhân',
      'Tối ưu hóa giao diện'
    ]
  },
  {
    id: 'marketing',
    title: 'Cookies marketing',
    description: 'Được sử dụng để hiển thị quảng cáo phù hợp',
    icon: Eye,
    color: 'from-orange-500 to-red-500',
    required: false,
    examples: [
      'Hiển thị quảng cáo cá nhân hóa',
      'Theo dõi hiệu quả quảng cáo',
      'Tối ưu hóa chiến dịch marketing'
    ]
  }
]

const cookieDetails = [
  {
    name: 'session_id',
    type: 'Essential',
    purpose: 'Duy trì phiên đăng nhập',
    duration: 'Phiên làm việc',
    provider: 'Chinese Learning'
  },
  {
    name: 'user_preferences',
    type: 'Functional',
    purpose: 'Lưu tùy chọn người dùng',
    duration: '1 năm',
    provider: 'Chinese Learning'
  },
  {
    name: '_ga',
    type: 'Analytics',
    purpose: 'Phân tích lưu lượng truy cập',
    duration: '2 năm',
    provider: 'Google Analytics'
  },
  {
    name: 'marketing_campaign',
    type: 'Marketing',
    purpose: 'Theo dõi hiệu quả quảng cáo',
    duration: '6 tháng',
    provider: 'Facebook Pixel'
  }
]

export const CookiePolicy = () => {
  const [cookieSettings, setCookieSettings] = useState({
    essential: true, // Always required
    analytics: false,
    functional: false,
    marketing: false
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to localStorage and update cookie consent
    alert('Cài đặt cookies đã được lưu!')
  }

  const handleAcceptAll = () => {
    setCookieSettings({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    })
    alert('Đã chấp nhận tất cả cookies!')
  }

  const handleRejectAll = () => {
    setCookieSettings({
      essential: true, // Always required
      analytics: false,
      functional: false,
      marketing: false
    })
    alert('Đã từ chối cookies không cần thiết!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cookie className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Chính sách Cookies</h1>
          </div>
          <p className="text-gray-600 mb-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
          <Badge variant="outline" className="text-sm">
            Phiên bản 1.0
          </Badge>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies là gì?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập website. 
              Chúng giúp chúng tôi cung cấp trải nghiệm tốt hơn và hiểu cách bạn sử dụng dịch vụ.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Quyền riêng tư của bạn</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Bạn có quyền kiểm soát cookies. Bạn có thể chấp nhận, từ chối hoặc tùy chỉnh 
                    các loại cookies mà bạn muốn cho phép.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Các loại Cookies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {cookieTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card key={type.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {type.title}
                          {type.required && (
                            <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {type.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Cookie Details Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Chi tiết Cookies
            </CardTitle>
            <CardDescription>
              Danh sách các cookies cụ thể mà chúng tôi sử dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Tên Cookie</th>
                    <th className="text-left py-3 px-2">Loại</th>
                    <th className="text-left py-3 px-2">Mục đích</th>
                    <th className="text-left py-3 px-2">Thời gian</th>
                    <th className="text-left py-3 px-2">Nhà cung cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieDetails.map((cookie, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2 font-mono text-xs">{cookie.name}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {cookie.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{cookie.purpose}</td>
                      <td className="py-3 px-2">{cookie.duration}</td>
                      <td className="py-3 px-2">{cookie.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Cài đặt Cookies
            </CardTitle>
            <CardDescription>
              Tùy chỉnh các loại cookies mà bạn muốn cho phép
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cookieTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center`}>
                      <type.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {type.required ? (
                      <Badge variant="destructive">Bắt buộc</Badge>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cookieSettings[type.id as keyof typeof cookieSettings]}
                          onChange={(e) => setCookieSettings(prev => ({
                            ...prev,
                            [type.id]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {cookieSettings[type.id as keyof typeof cookieSettings] ? 'Bật' : 'Tắt'}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={handleAcceptAll} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Chấp nhận tất cả
              </Button>
              <Button variant="outline" onClick={handleRejectAll} className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Từ chối tất cả
              </Button>
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Lưu cài đặt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Browser Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Cài đặt trình duyệt
            </CardTitle>
            <CardDescription>
              Cách quản lý cookies trong trình duyệt của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Chrome</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Cài đặt → Bảo mật và quyền riêng tư → Cookies
                </p>
                <Button variant="outline" size="sm">Hướng dẫn</Button>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Firefox</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Tùy chọn → Quyền riêng tư & Bảo mật → Cookies
                </p>
                <Button variant="outline" size="sm">Hướng dẫn</Button>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Safari</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Tùy chọn → Quyền riêng tư → Quản lý dữ liệu website
                </p>
                <Button variant="outline" size="sm">Hướng dẫn</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Liên hệ
            </CardTitle>
            <CardDescription>
              Nếu bạn có câu hỏi về chính sách cookies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Email</h4>
                <p className="text-sm text-gray-600">privacy@chineselearning.com</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Phone className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Điện thoại</h4>
                <p className="text-sm text-gray-600">+84 123 456 789</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Chính sách cookies này có thể được cập nhật định kỳ. 
            Chúng tôi sẽ thông báo về những thay đổi quan trọng.
          </p>
        </div>
      </div>
    </div>
  )
}


