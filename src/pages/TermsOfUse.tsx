import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  FileText, 
  User, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  // Calendar
} from 'lucide-react'

const termsSections = [
  {
    id: 'acceptance',
    title: 'Chấp nhận điều khoản',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500',
    content: [
      'Bằng việc sử dụng dịch vụ Chinese Learning, bạn đồng ý tuân thủ các điều khoản này.',
      'Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ.',
      'Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào.'
    ]
  },
  {
    id: 'user-account',
    title: 'Tài khoản người dùng',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    content: [
      'Bạn phải cung cấp thông tin chính xác và cập nhật khi đăng ký tài khoản.',
      'Bạn chịu trách nhiệm bảo mật mật khẩu và tài khoản của mình.',
      'Một người chỉ được tạo một tài khoản duy nhất.',
      'Chúng tôi có quyền tạm khóa hoặc xóa tài khoản vi phạm.'
    ]
  },
  {
    id: 'acceptable-use',
    title: 'Sử dụng hợp lệ',
    icon: Shield,
    color: 'from-purple-500 to-pink-500',
    content: [
      'Sử dụng dịch vụ chỉ cho mục đích học tập cá nhân.',
      'Không được sử dụng để vi phạm pháp luật hoặc quyền của người khác.',
      'Không được cố gắng hack, phá hoại hoặc can thiệp vào hệ thống.',
      'Không được chia sẻ tài khoản với người khác.'
    ]
  },
  {
    id: 'prohibited-activities',
    title: 'Hoạt động bị cấm',
    icon: XCircle,
    color: 'from-red-500 to-pink-500',
    content: [
      'Sử dụng bot, script hoặc công cụ tự động khác.',
      'Cố gắng reverse engineer hoặc sao chép dịch vụ.',
      'Phát tán virus, malware hoặc mã độc hại.',
      'Thu thập thông tin của người dùng khác.',
      'Sử dụng dịch vụ cho mục đích thương mại không được phép.'
    ]
  }
]

const userRights = [
  {
    title: 'Quyền truy cập',
    description: 'Truy cập vào tất cả tính năng miễn phí của dịch vụ',
    icon: CheckCircle
  },
  {
    title: 'Quyền học tập',
    description: 'Học từ vựng, làm bài test và sử dụng tài liệu',
    icon: CheckCircle
  },
  {
    title: 'Quyền hỗ trợ',
    description: 'Nhận hỗ trợ kỹ thuật và tư vấn học tập',
    icon: CheckCircle
  }
]

const userObligations = [
  {
    title: 'Tuân thủ pháp luật',
    description: 'Sử dụng dịch vụ theo đúng quy định pháp luật',
    icon: Shield
  },
  {
    title: 'Bảo mật thông tin',
    description: 'Bảo vệ thông tin tài khoản và không chia sẻ với người khác',
    icon: Shield
  },
  {
    title: 'Sử dụng đúng mục đích',
    description: 'Chỉ sử dụng cho mục đích học tập cá nhân',
    icon: Shield
  }
]

export const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Điều khoản sử dụng</h1>
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
              Chào mừng bạn đến với Chinese Learning! Các điều khoản sử dụng này quy định 
              cách bạn có thể sử dụng dịch vụ của chúng tôi.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Lưu ý quan trọng</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản này. 
                    Vui lòng đọc kỹ trước khi sử dụng.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6 mb-8">
          {termsSections.map((section) => {
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

        {/* User Rights and Obligations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Quyền của người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRights.map((right, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <right.icon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{right.title}</h4>
                      <p className="text-sm text-gray-600">{right.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Shield className="h-5 w-5" />
                Nghĩa vụ của người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userObligations.map((obligation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <obligation.icon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{obligation.title}</h4>
                      <p className="text-sm text-gray-600">{obligation.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intellectual Property */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Sở hữu trí tuệ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Tất cả nội dung, tính năng và dịch vụ của Chinese Learning được bảo vệ bởi luật sở hữu trí tuệ.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Bạn không được sao chép, phân phối hoặc sử dụng nội dung cho mục đích thương mại</li>
                <li>• Bạn có thể sử dụng nội dung cho mục đích học tập cá nhân</li>
                <li>• Mọi vi phạm bản quyền sẽ bị xử lý theo pháp luật</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Chấm dứt dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Chúng tôi có quyền tạm khóa hoặc chấm dứt tài khoản của bạn nếu:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Vi phạm các điều khoản sử dụng</li>
                <li>• Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>• Cố gắng hack hoặc phá hoại hệ thống</li>
                <li>• Không hoạt động trong thời gian dài</li>
              </ul>
              <p className="text-sm text-gray-600">
                Bạn có thể chấm dứt tài khoản bất kỳ lúc nào bằng cách liên hệ với chúng tôi.
              </p>
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
              Nếu bạn có câu hỏi về các điều khoản này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Email</h4>
                <p className="text-sm text-gray-600">support@chineselearning.com</p>
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
            Các điều khoản này có thể được cập nhật định kỳ. 
            Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi được coi là chấp nhận các điều khoản mới.
          </p>
        </div>
      </div>
    </div>
  )
}


