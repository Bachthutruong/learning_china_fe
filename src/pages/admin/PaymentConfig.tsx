import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  Settings, 
  Save, 
  Loader2,
  QrCode,
  Upload,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'


export const PaymentConfigPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Form state
  const [qrCodeImage, setQrCodeImage] = useState('')
  
  // Debug log when qrCodeImage changes
  useEffect(() => {
    console.log('qrCodeImage state changed:', qrCodeImage)
  }, [qrCodeImage])
  const [exchangeRate, setExchangeRate] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  useEffect(() => {
    fetchPaymentConfig()
  }, [])

  const fetchPaymentConfig = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/payment-config')
      
      // Populate form with current config
      if (response.data.config) {
        setQrCodeImage(response.data.config.qrCodeImage)
        setExchangeRate(response.data.config.exchangeRate.toString())
        setBankAccount(response.data.config.bankAccount)
        setBankName(response.data.config.bankName)
        setAccountHolder(response.data.config.accountHolder)
      }
    } catch (error) {
      console.error('Error fetching payment config:', error)
      toast.error('Không thể tải cấu hình thanh toán')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/qr-code', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('Upload response:', response.data)
      const imageUrl = response.data.imageUrl
      console.log('Setting image URL:', imageUrl)
      setQrCodeImage(imageUrl)
      
      // Test if image loads
      const img = new Image()
      img.onload = () => {
        console.log('Image loaded successfully:', imageUrl)
        toast.success('Ảnh QR code đã được upload thành công!')
      }
      img.onerror = (error) => {
        console.error('Image failed to load:', imageUrl, error)
        console.error('Image load error details:', {
          url: imageUrl,
          error: error,
          target: img
        })
        toast.error('Ảnh không thể hiển thị. Vui lòng thử lại.')
      }
      img.src = imageUrl
      
      // Also test with fetch
      fetch(imageUrl)
        .then(response => {
          console.log('Fetch response:', response.status, response.statusText)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return response.blob()
        })
        .then(blob => {
          console.log('Fetch successful, blob size:', blob.size)
        })
        .catch(error => {
          console.error('Fetch failed:', error)
        })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh')
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      handleImageUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!qrCodeImage || !exchangeRate || !bankAccount || !bankName || !accountHolder) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const rate = parseFloat(exchangeRate)
    if (isNaN(rate) || rate <= 0) {
      toast.error('Tỷ lệ quy đổi phải là số dương')
      return
    }

    setIsSaving(true)
    try {
      await api.post('/payment-config/admin', {
        qrCodeImage,
        exchangeRate: rate,
        bankAccount,
        bankName,
        accountHolder
      })

      toast.success('Cấu hình thanh toán đã được cập nhật!')
      fetchPaymentConfig()
    } catch (error: any) {
      console.error('Error updating payment config:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cấu hình')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cấu hình thanh toán</h1>
          <p className="text-gray-600">Cấu hình thông tin thanh toán và tỷ lệ quy đổi xu</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-500" />
              Thông tin thanh toán
            </CardTitle>
            <CardDescription>
              Cấu hình thông tin ngân hàng, QR code và tỷ lệ quy đổi xu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* QR Code Image */}
              <div className="space-y-2">
                <Label htmlFor="qrCodeImage">Ảnh QR Code</Label>
                
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="qrCodeImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  
                  {qrCodeImage ? (
                    <div className="space-y-4">
                      <div className="w-32 h-32 mx-auto border border-gray-300 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={qrCodeImage} 
                          alt="QR Code Preview" 
                          className="w-full h-full object-cover"
                          style={{ minHeight: '128px', minWidth: '128px' }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully in component:', qrCodeImage)
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load in component:', qrCodeImage)
                            console.error('Error details:', e)
                            toast.error('Không thể hiển thị ảnh. URL có thể không hợp lệ.')
                          }}
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('qrCodeImage')?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang upload...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Thay đổi ảnh
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setQrCodeImage('')}
                          disabled={isUploading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Xóa ảnh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <QrCode className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Chọn ảnh QR code để upload
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('qrCodeImage')?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang upload...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Chọn ảnh
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">
                  Hỗ trợ định dạng: JPG, PNG, GIF, WebP. Kích thước tối đa: 5MB
                </p>
                
                {/* Debug info */}
                {/* {qrCodeImage && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <p><strong>Debug - Current URL:</strong></p>
                    <p className="break-all text-blue-600">{qrCodeImage}</p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => window.open(qrCodeImage, '_blank')}
                        className="text-blue-600 hover:underline"
                      >
                        Mở ảnh trong tab mới
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          console.log('Testing image URL:', qrCodeImage)
                          fetch(qrCodeImage)
                            .then(response => {
                              console.log('Fetch response:', response.status, response.statusText)
                              if (response.ok) {
                                console.log('✅ Image URL is accessible')
                                toast.success('URL ảnh hợp lệ!')
                              } else {
                                console.log('❌ Image URL not accessible')
                                toast.error('URL ảnh không hợp lệ!')
                              }
                            })
                            .catch(error => {
                              console.error('❌ Fetch error:', error)
                              toast.error('Lỗi khi kiểm tra URL ảnh!')
                            })
                        }}
                        className="text-green-600 hover:underline"
                      >
                        Test URL
                      </button>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Exchange Rate */}
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Tỷ lệ quy đổi (xu/TWD)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="Ví dụ: 10 (1 TWD = 10 xu)"
                  required
                />
                <p className="text-xs text-gray-500">
                  Số xu người dùng nhận được khi mua 1 TWD
                </p>
              </div>

              {/* Bank Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Tên ngân hàng</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ví dụ: Taiwan Bank"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Số tài khoản</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Nhập số tài khoản"
                    required
                  />
                </div>
              </div>

              {/* Account Holder */}
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Chủ tài khoản</Label>
                <Input
                  id="accountHolder"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Tên chủ tài khoản"
                  required
                />
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Preview thông tin thanh toán</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Ngân hàng:</strong> {bankName || 'Chưa nhập'}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Số tài khoản:</strong> {bankAccount || 'Chưa nhập'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Chủ tài khoản:</strong> {accountHolder || 'Chưa nhập'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 mb-2">QR Code</p>
                    {qrCodeImage ? (
                      <img 
                        src={qrCodeImage} 
                        alt="QR Code" 
                        className="w-24 h-24 mx-auto border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 mx-auto border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-700">
                    <strong>Tỷ lệ quy đổi:</strong> 1 TWD = {exchangeRate || '0'} xu
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu cấu hình
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
