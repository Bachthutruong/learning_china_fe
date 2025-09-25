import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Shield, 
  Eye, 
  Lock, 
  User, 
  Database,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'

const privacySections = [
  {
    id: 'information-collection',
    title: 'Thu thập thông tin',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    content: [
      'Chúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, sử dụng dịch vụ hoặc liên hệ với chúng tôi.',
      'Thông tin thu thập bao gồm: tên, email, dữ liệu học tập, tiến độ và thành tích.',
      'Chúng tôi sử dụng cookies và công nghệ tương tự để cải thiện trải nghiệm người dùng.'
    ]
  },
  {
    id: 'information-use',
    title: 'Sử dụng thông tin',
    icon: Eye,
    color: 'from-green-500 to-emerald-500',
    content: [
      'Cung cấp và cải thiện dịch vụ học tập cá nhân hóa.',
      'Gửi thông báo về tiến độ học tập và thành tích.',
      'Phân tích dữ liệu để cải thiện chất lượng nội dung và tính năng.',
      'Liên hệ hỗ trợ khách hàng khi cần thiết.'
    ]
  },
  {
    id: 'information-sharing',
    title: 'Chia sẻ thông tin',
    icon: User,
    color: 'from-purple-500 to-pink-500',
    content: [
      'Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân với bên thứ ba.',
      'Chỉ chia sẻ thông tin khi có yêu cầu pháp lý hoặc để bảo vệ quyền lợi của chúng tôi.',
      'Có thể chia sẻ dữ liệu tổng hợp (không thể nhận dạng cá nhân) cho mục đích nghiên cứu.'
    ]
  },
  {
    id: 'data-security',
    title: 'Bảo mật dữ liệu',
    icon: Lock,
    color: 'from-orange-500 to-red-500',
    content: [
      'Sử dụng mã hóa SSL/TLS để bảo vệ dữ liệu trong quá trình truyền tải.',
      'Lưu trữ dữ liệu trên các máy chủ an toàn với các biện pháp bảo mật nghiêm ngặt.',
      'Chỉ nhân viên được ủy quyền mới có thể truy cập thông tin cá nhân.',
      'Thường xuyên cập nhật và kiểm tra các biện pháp bảo mật.'
    ]
  }
]

const contactInfo = [
  {
    title: 'Email',
    value: 'privacy@chineselearning.com',
    icon: Mail
  },
  {
    title: 'Điện thoại',
    value: '+84 123 456 789',
    icon: Phone
  },
  {
    title: 'Địa chỉ',
    value: 'Hà Nội, Việt Nam',
    icon: Shield
  }
]

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Giới thiệu</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chinese Learning cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. 
              Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản trong chính sách này.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-6 mb-8">
          {privacySections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* User Rights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Quyền của người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Quyền truy cập</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Xem thông tin cá nhân đã lưu trữ</li>
                  <li>• Yêu cầu sao chép dữ liệu</li>
                  <li>• Cập nhật thông tin không chính xác</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Quyền xóa</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Xóa tài khoản và dữ liệu</li>
                  <li>• Rút lại sự đồng ý</li>
                  <li>• Yêu cầu ngừng xử lý dữ liệu</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Cookies và công nghệ tương tự
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Chúng tôi sử dụng cookies để:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Ghi nhớ tùy chọn và cài đặt của bạn</li>
                <li>• Cải thiện hiệu suất và trải nghiệm người dùng</li>
                <li>• Phân tích cách sử dụng dịch vụ</li>
                <li>• Cung cấp nội dung cá nhân hóa</li>
              </ul>
              <p className="text-sm text-gray-600">
                Bạn có thể quản lý cookies thông qua cài đặt trình duyệt của mình.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Liên hệ về bảo mật
            </CardTitle>
            <CardDescription>
              Nếu bạn có câu hỏi về chính sách bảo mật này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
                return (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">{info.title}</h4>
                    <p className="text-sm text-gray-600">{info.value}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Chính sách này có thể được cập nhật định kỳ. Chúng tôi sẽ thông báo về những thay đổi quan trọng.
          </p>
        </div>
      </div>
    </div>
  )
}


