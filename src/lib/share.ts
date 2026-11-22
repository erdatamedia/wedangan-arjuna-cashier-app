/** Bagikan teks (Web Share API -> WhatsApp). Mengembalikan cara yang dipakai. */
export async function shareText(text: string): Promise<'share' | 'whatsapp' | 'cancelled'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'share'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  return 'whatsapp'
}
