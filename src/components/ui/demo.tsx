import { RulerCarousel, type CarouselItem } from '@/components/ui/ruler-carousel'

export function Demo() {
  const originalItems: CarouselItem[] = [
    { id: '1', title: 'NIKE' },
    { id: '2', title: 'ALO' },
    { id: '3', title: 'CONVERSE' },
    { id: '4', title: 'UNIQLO' },
    { id: '5', title: 'ON CLOUD' },
    { id: '6', title: 'SKIMS' },
    { id: '7', title: 'ADIDAS' },
    { id: '8', title: 'PUMA' },
    { id: '9', title: 'REEBOK' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden">
      <RulerCarousel originalItems={originalItems} />
    </div>
  )
}