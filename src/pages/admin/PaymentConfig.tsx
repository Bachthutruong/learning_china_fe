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

  // Form state for TW and VN
  const [twQr, setTwQr] = useState('')
  const [twRate, setTwRate] = useState('')
  const [twBankAccount, setTwBankAccount] = useState('')
  const [twBankName, setTwBankName] = useState('')
  const [twAccountHolder, setTwAccountHolder] = useState('')

  const [vnQr, setVnQr] = useState('')
  const [vnRate, setVnRate] = useState('')
  const [vnBankAccount, setVnBankAccount] = useState('')
  const [vnBankName, setVnBankName] = useState('')
  const [vnAccountHolder, setVnAccountHolder] = useState('')

  useEffect(() => {
    fetchPaymentConfig()
  }, [])

  const fetchPaymentConfig = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/payment-config')
      
      // Populate form with current config
      const cfg = response.data.config
      if (cfg?.tw) {
        setTwQr(cfg.tw.qrCodeImage || '')
        setTwRate((cfg.tw.exchangeRate ?? '').toString())
        setTwBankAccount(cfg.tw.bankAccount || '')
        setTwBankName(cfg.tw.bankName || '')
        setTwAccountHolder(cfg.tw.accountHolder || '')
      }
      if (cfg?.vn) {
        setVnQr(cfg.vn.qrCodeImage || '')
        setVnRate((cfg.vn.exchangeRate ?? '').toString())
        setVnBankAccount(cfg.vn.bankAccount || '')
        setVnBankName(cfg.vn.bankName || '')
        setVnAccountHolder(cfg.vn.accountHolder || '')
      }
    } catch (error) {
      console.error('Error fetching payment config:', error)
      toast.error('Không thể tải cấu hình thanh toán')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, target: 'tw' | 'vn') => {
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
      if (target === 'tw') setTwQr(imageUrl)
      else setVnQr(imageUrl)
      
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'tw' | 'vn') => {
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

      handleImageUpload(file, target)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const requiredFilled = [
      twQr, twRate, twBankAccount, twBankName, twAccountHolder,
      vnQr, vnRate, vnBankAccount, vnBankName, vnAccountHolder
    ].every(v => v !== '' && v !== undefined && v !== null)
    if (!requiredFilled) {
      toast.error('Vui lòng điền đầy đủ thông tin cho cả tài khoản Đài Loan và Việt Nam')
      return
    }

    const twRateNum = parseFloat(twRate)
    const vnRateNum = parseFloat(vnRate)
    if (isNaN(twRateNum) || twRateNum <= 0 || isNaN(vnRateNum) || vnRateNum <= 0) {
      toast.error('Tỷ lệ quy đổi phải là số dương cho cả TW và VN')
      return
    }

    setIsSaving(true)
    try {
      await api.post('/payment-config/admin', {
        tw: {
          qrCodeImage: twQr,
          exchangeRate: twRateNum,
          bankAccount: twBankAccount,
          bankName: twBankName,
          accountHolder: twAccountHolder
        },
        vn: {
          qrCodeImage: vnQr,
          exchangeRate: vnRateNum,
          bankAccount: vnBankAccount,
          bankName: vnBankName,
          accountHolder: vnAccountHolder
        }
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
              {/* Taiwan (TWD) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Tài khoản Đài Loan (TWD)</h3>
                {/* TW QR */}
                <div className="space-y-2">
                  <Label>Ảnh QR Code (TWD)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="twQr"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'tw')}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {twQr ? (
                      <div className="space-y-4">
                        <div className="w-32 h-32 mx-auto border border-gray-300 rounded overflow-hidden bg-gray-100">
                          <img src={twQr} alt="TW QR" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button type="button" variant="outline" onClick={() => document.getElementById('twQr')?.click()} disabled={isUploading}>
                            {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang upload...</>) : (<><Upload className="h-4 w-4 mr-2" />Thay đổi ảnh</>)}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setTwQr('')} disabled={isUploading} className="text-red-600 hover:text-red-700">
                            <X className="h-4 w-4 mr-2" />Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <QrCode className="h-12 w-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Chọn ảnh QR code để upload</p>
                          <Button type="button" variant="outline" onClick={() => document.getElementById('twQr')?.click()} disabled={isUploading}>
                            {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang upload...</>) : (<><Upload className="h-4 w-4 mr-2" />Chọn ảnh</>)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tỷ lệ (xu/TWD)</Label>
                    <Input type="number" step="0.01" min="0.01" value={twRate} onChange={(e) => setTwRate(e.target.value)} placeholder="Ví dụ: 10" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên ngân hàng</Label>
                    <Input value={twBankName} onChange={(e) => setTwBankName(e.target.value)} placeholder="Taiwan Bank" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Số tài khoản</Label>
                    <Input value={twBankAccount} onChange={(e) => setTwBankAccount(e.target.value)} placeholder="Số tài khoản" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chủ tài khoản</Label>
                  <Input value={twAccountHolder} onChange={(e) => setTwAccountHolder(e.target.value)} placeholder="Tên chủ tài khoản" required />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Preview (TWD)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-gray-700">
                      <p><strong>Ngân hàng:</strong> {twBankName || 'Chưa nhập'}</p>
                      <p><strong>Số tài khoản:</strong> {twBankAccount || 'Chưa nhập'}</p>
                      <p><strong>Chủ tài khoản:</strong> {twAccountHolder || 'Chưa nhập'}</p>
                      <p className="mt-1"><strong>Tỷ lệ:</strong> 1 TWD = {twRate || '0'} xu</p>
                    </div>
                    <div className="text-center">
                      {twQr ? (
                        <img src={twQr} alt="TW QR" className="w-24 h-24 mx-auto border rounded" />
                      ) : (
                        <div className="w-24 h-24 mx-auto border rounded bg-gray-100 flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vietnam (VND) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Tài khoản Việt Nam (VND)</h3>
                {/* VN QR */}
                <div className="space-y-2">
                  <Label>Ảnh QR Code (VND)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="vnQr"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'vn')}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {vnQr ? (
                      <div className="space-y-4">
                        <div className="w-32 h-32 mx-auto border border-gray-300 rounded overflow-hidden bg-gray-100">
                          <img src={vnQr} alt="VN QR" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button type="button" variant="outline" onClick={() => document.getElementById('vnQr')?.click()} disabled={isUploading}>
                            {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang upload...</>) : (<><Upload className="h-4 w-4 mr-2" />Thay đổi ảnh</>)}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setVnQr('')} disabled={isUploading} className="text-red-600 hover:text-red-700">
                            <X className="h-4 w-4 mr-2" />Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <QrCode className="h-12 w-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Chọn ảnh QR code để upload</p>
                          <Button type="button" variant="outline" onClick={() => document.getElementById('vnQr')?.click()} disabled={isUploading}>
                            {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang upload...</>) : (<><Upload className="h-4 w-4 mr-2" />Chọn ảnh</>)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tỷ lệ (xu/VND)</Label>
                    <Input type="number" value={vnRate} onChange={(e) => setVnRate(e.target.value)} placeholder="Ví dụ: 0.001" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên ngân hàng</Label>
                    <Input value={vnBankName} onChange={(e) => setVnBankName(e.target.value)} placeholder="Vietcombank" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Số tài khoản</Label>
                    <Input value={vnBankAccount} onChange={(e) => setVnBankAccount(e.target.value)} placeholder="Số tài khoản" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chủ tài khoản</Label>
                  <Input value={vnAccountHolder} onChange={(e) => setVnAccountHolder(e.target.value)} placeholder="Tên chủ tài khoản" required />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Preview (VND)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-gray-700">
                      <p><strong>Ngân hàng:</strong> {vnBankName || 'Chưa nhập'}</p>
                      <p><strong>Số tài khoản:</strong> {vnBankAccount || 'Chưa nhập'}</p>
                      <p><strong>Chủ tài khoản:</strong> {vnAccountHolder || 'Chưa nhập'}</p>
                      <p className="mt-1"><strong>Tỷ lệ:</strong> 1 VND = {vnRate || '0'} xu</p>
                    </div>
                    <div className="text-center">
                      {vnQr ? (
                        <img src={vnQr} alt="VN QR" className="w-24 h-24 mx-auto border rounded" />
                      ) : (
                        <div className="w-24 h-24 mx-auto border rounded bg-gray-100 flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
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
