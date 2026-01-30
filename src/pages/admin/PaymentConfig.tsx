import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  Save, 
  Loader2,
  QrCode,
  Upload
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <QrCode className="w-6 h-6" />
             </div>
             Cổng thanh toán
          </h1>
          <p className="text-gray-500 font-medium">Cấu hình thông tin tài khoản nhận tiền và tỷ giá quy đổi Xu cho học viên.</p>
        </div>
        
        <Button onClick={handleSubmit} disabled={isSaving} className="chinese-gradient h-11 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cấu hình hệ thống
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         {/* Taiwan (TWD) */}
         <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-bl-[4rem]" />
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
               <div className="w-2 h-6 bg-blue-500 rounded-full mr-3" />
               Tài khoản Đài Loan (TWD)
            </h3>

            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Mã QR Thanh toán</Label>
                  <div 
                    onClick={() => !isUploading && document.getElementById('twQr')?.click()}
                    className={`relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                      twQr ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-blue-300 hover:bg-white'
                    }`}
                  >
                     <input type="file" id="twQr" className="hidden" onChange={(e) => handleFileChange(e, 'tw')} accept="image/*" />
                     {isUploading ? (
                       <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                     ) : twQr ? (
                       <img src={twQr} className="h-full w-full object-contain" alt="TW QR" />
                     ) : (
                       <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-gray-400">Tải lên mã QR TWD</p>
                       </div>
                     )}
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tỷ lệ quy đổi (Xu/TWD)</Label>
                     <Input type="number" value={twRate} onChange={(e) => setTwRate(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-black" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tên ngân hàng</Label>
                     <Input value={twBankName} onChange={(e) => setTwBankName(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-bold" />
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Số tài khoản</Label>
                     <Input value={twBankAccount} onChange={(e) => setTwBankAccount(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-black text-blue-600" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Chủ tài khoản</Label>
                     <Input value={twAccountHolder} onChange={(e) => setTwAccountHolder(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-bold" />
                  </div>
               </div>
            </div>
         </div>

         {/* Vietnam (VND) */}
         <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-5 rounded-bl-[4rem]" />
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
               <div className="w-2 h-6 bg-red-500 rounded-full mr-3" />
               Tài khoản Việt Nam (VND)
            </h3>

            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Mã QR Thanh toán</Label>
                  <div 
                    onClick={() => !isUploading && document.getElementById('vnQr')?.click()}
                    className={`relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                      vnQr ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-red-300 hover:bg-white'
                    }`}
                  >
                     <input type="file" id="vnQr" className="hidden" onChange={(e) => handleFileChange(e, 'vn')} accept="image/*" />
                     {isUploading ? (
                       <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                     ) : vnQr ? (
                       <img src={vnQr} className="h-full w-full object-contain" alt="VN QR" />
                     ) : (
                       <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-gray-400">Tải lên mã QR VND</p>
                       </div>
                     )}
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tỷ lệ quy đổi (Xu/VND)</Label>
                     <Input type="number" value={vnRate} onChange={(e) => setVnRate(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-black" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tên ngân hàng</Label>
                     <Input value={vnBankName} onChange={(e) => setVnBankName(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-bold" />
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Số tài khoản</Label>
                     <Input value={vnBankAccount} onChange={(e) => setVnBankAccount(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-black text-red-600" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Chủ tài khoản</Label>
                     <Input value={vnAccountHolder} onChange={(e) => setVnAccountHolder(e.target.value)} className="h-12 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-bold" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
