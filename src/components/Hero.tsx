import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <img src="/hero.png" alt="Hero background" className="hero-img" />
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-content container">
        <h1 className="hero-title">
          <span className="fade-in-up delay-1">Ahead of</span>
          <br />
          <span className="fade-in-up delay-2 highlight">Digital</span>
        </h1>
        <p className="hero-subtitle fade-in-up delay-3">
          Your partner for digital transformation, performance, and strategy.
        </p>
        <div className="hero-actions fade-in-up delay-4">
          <button className="button-primary play-button">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Showreel
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
