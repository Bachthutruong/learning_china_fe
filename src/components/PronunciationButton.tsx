import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface PronunciationButtonProps {
  /** Từ / chuỗi Hán tự cần phát âm */
  text: string
  /** URL audio có sẵn (ưu tiên nếu có) */
  audioUrl?: string
  /**
   * Ngôn ngữ / giọng đọc BCP-47.
   * Mặc định 'zh-TW' (tiếng Trung phồn thể - Đài Loan).
   * Có thể truyền 'zh-CN' nếu muốn giản thể.
   */
  lang?: string
  /** Tốc độ đọc (0.1 – 10). Mặc định 0.9 để rõ hơn. */
  rate?: number
  /** Size preset */
  size?: 'sm' | 'md' | 'lg'
  /** Style variant */
  variant?: 'ghost' | 'solid' | 'outline'
  className?: string
  /** Có hiển thị tooltip không (title attr) */
  title?: string
  /** Ngăn click lan lên phần tử cha (rất quan trọng khi nằm trong 1 card có onClick) */
  stopPropagation?: boolean
}

/**
 * Nút phát âm từ vựng tiếng Trung.
 *
 * Logic phát âm:
 * 1. Nếu có `audioUrl` hợp lệ -> phát file audio đó.
 * 2. Nếu không -> dùng Web Speech API (SpeechSynthesis) với `lang` (mặc định `zh-TW`).
 * 3. Cố gắng chọn giọng phù hợp nhất trong danh sách `speechSynthesis.getVoices()`.
 */
export const PronunciationButton = ({
  text,
  audioUrl,
  lang = 'zh-TW',
  rate = 0.9,
  size = 'md',
  variant = 'ghost',
  className,
  title = 'Nghe phát âm',
  stopPropagation = true,
}: PronunciationButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Preload voices (Chrome cần gọi getVoices sớm để voices có trên lần đầu)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const load = () => window.speechSynthesis.getVoices()
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load)
    }
  }, [])

  // Dừng audio khi unmount để tránh rò rỉ
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
    }
  }, [])

  const pickVoice = useCallback((targetLang: string): SpeechSynthesisVoice | undefined => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return undefined

    const normalized = targetLang.toLowerCase()
    const baseLang = normalized.split('-')[0]

    // Ưu tiên exact match (zh-TW), sau đó theo base lang (zh), cuối cùng bất kỳ voice zh
    return (
      voices.find(v => v.lang?.toLowerCase() === normalized) ||
      voices.find(v => v.lang?.toLowerCase().startsWith(normalized)) ||
      voices.find(v => v.lang?.toLowerCase().startsWith(baseLang + '-')) ||
      voices.find(v => v.lang?.toLowerCase().startsWith(baseLang))
    )
  }, [])

  const speakWithTTS = useCallback((content: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Trình duyệt không hỗ trợ phát âm. Vui lòng dùng Chrome/Edge/Safari mới.')
      setIsPlaying(false)
      return
    }

    const synth = window.speechSynthesis
    try { synth.cancel() } catch {}

    const utter = new SpeechSynthesisUtterance(content)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1

    const voice = pickVoice(lang)
    if (voice) utter.voice = voice

    utter.onend = () => setIsPlaying(false)
    utter.onerror = () => {
      setIsPlaying(false)
      toast.error('Không thể phát âm. Vui lòng thử lại.')
    }

    setIsPlaying(true)
    // Một số trình duyệt (đặc biệt Chrome) có bug: phải delay nhỏ mới phát được
    // nếu đã cancel ngay trước đó.
    setTimeout(() => {
      try { synth.speak(utter) } catch {
        setIsPlaying(false)
      }
    }, 60)
  }, [lang, rate, pickVoice])

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (isPlaying) {
      // Toggle dừng
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
      setIsPlaying(false)
      return
    }

    if (!text || !text.trim()) {
      toast.error('Không có nội dung để phát âm')
      return
    }

    // Ưu tiên audioUrl
    if (audioUrl) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl)
        } else {
          audioRef.current.src = audioUrl
        }
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.onerror = () => {
          // Fallback sang TTS nếu file audio bị lỗi
          speakWithTTS(text)
        }
        setIsPlaying(true)
        await audioRef.current.play()
        return
      } catch {
        // Nếu play file audio lỗi -> fallback TTS
        speakWithTTS(text)
        return
      }
    }

    speakWithTTS(text)
  }, [audioUrl, text, isPlaying, speakWithTTS, stopPropagation])

  const sizeClass =
    size === 'sm' ? 'w-8 h-8' :
    size === 'lg' ? 'w-14 h-14' :
    'w-10 h-10'

  const iconClass =
    size === 'sm' ? 'w-4 h-4' :
    size === 'lg' ? 'w-6 h-6' :
    'w-5 h-5'

  const variantClass =
    variant === 'solid' ? 'chinese-gradient text-white shadow-lg hover:shadow-xl' :
    variant === 'outline' ? 'border-2 border-primary/20 text-primary hover:bg-primary/5 bg-white' :
    'text-gray-400 hover:text-primary hover:bg-primary/5'

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center justify-center rounded-xl transition-all active:scale-95',
        sizeClass,
        variantClass,
        isPlaying && 'text-primary bg-primary/10 animate-pulse',
        className,
      )}
    >
      {isPlaying ? (
        <Loader2 className={cn(iconClass, 'animate-spin')} />
      ) : (
        <Volume2 className={iconClass} />
      )}
    </button>
  )
}

export default PronunciationButton
