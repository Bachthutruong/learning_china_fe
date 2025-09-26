import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Play, Pause, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface AudioUploadProps {
  value?: File | string | null
  onChange: (file: File | null) => void
  disabled?: boolean
  maxSize?: number // in MB
  accept?: string
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  value,
  onChange,
  disabled = false,
  maxSize = 10,
  accept = 'audio/*'
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Vui lòng chọn file âm thanh')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File quá lớn. Kích thước tối đa: ${maxSize}MB`)
      return
    }

    onChange(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    
    toast.success('File âm thanh đã được chọn')
  }

  // Set audioUrl when value is a string (existing audioUrl)
  React.useEffect(() => {
    if (typeof value === 'string' && value && !value.startsWith('blob:')) {
      setAudioUrl(value)
    }
  }, [value])

  const handleRemove = () => {
    onChange(null)
    setAudioUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    // Clear any existing audio URL
    if (typeof value === 'string' && value.startsWith('blob:')) {
      URL.revokeObjectURL(value)
    }
  }

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const getFileName = () => {
    if (value instanceof File) {
      return value.name
    }
    if (typeof value === 'string' && value) {
      return value.split('/').pop() || 'Audio file'
    }
    return null
  }

  const getFileSize = () => {
    if (value instanceof File) {
      return `${(value.size / 1024 / 1024).toFixed(2)} MB`
    }
    return null
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      {!value && !audioUrl ? (
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Tải lên file âm thanh</h3>
                <p className="text-sm text-gray-500">
                  Kéo thả file vào đây hoặc click để chọn
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Kích thước tối đa: {maxSize}MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Chọn file âm thanh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getFileName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getFileSize() || (typeof value === 'string' ? 'Cloudinary Audio' : '')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePlay}
                  disabled={disabled}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element for preview */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          onError={() => {
            toast.error('Không thể phát file âm thanh')
            setIsPlaying(false)
          }}
          onLoadStart={() => {
            console.log('Loading audio:', audioUrl)
          }}
          className="hidden"
        />
      )}
    </div>
  )
}
