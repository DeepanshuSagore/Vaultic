import { Button } from '@/components/ui/button'

function App() {
  const navLinks = ['Home', 'Studio', 'About', 'Journal', 'Reach Us']

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          type="video/mp4"
        />
      </video>

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
          <a
            href="#"
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah<sup className="text-xs">&reg;</sup>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isActive = link === 'Home'

              return (
                <li key={link}>
                  <a
                    href="#"
                    className={`text-sm transition-colors ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link}
                  </a>
                </li>
              )
            })}
          </ul>

          <Button
            variant="ghost"
            className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] hover:bg-transparent"
          >
            Begin Journey
          </Button>
        </nav>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-40 py-[90px] text-center">
          <h1
            className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] sm:text-7xl md:text-8xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <em className="not-italic text-muted-foreground">dreams</em>{' '}
            rise <em className="not-italic text-muted-foreground">through the silence.</em>
          </h1>

          <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            We're designing tools for deep thinkers, bold creators, and quiet
            rebels. Amid the chaos, we build digital spaces for sharp focus and
            inspired work.
          </p>

          <Button
            variant="ghost"
            className="liquid-glass animate-fade-rise-delay-2 mt-12 cursor-pointer rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03] hover:bg-transparent"
          >
            Begin Journey
          </Button>
        </main>
      </div>
    </div>
  )
}

export default App
