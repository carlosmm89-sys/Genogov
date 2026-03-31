import './SuccessCases.css';

const SuccessCases = () => {
  return (
    <section id="cases" className="success-cases-section">
      <div className="cases-container container">
        <div className="cases-content">
          <h2>
            Casos de éxito que<br/>
            <span>inspiran.</span>
          </h2>
          <p>
            Vemos más allá de lo evidente para encontrar palancas de crecimiento no convencionales. Descubre cómo estamos transformando el negocio de marcas líderes.
          </p>
          <div className="cases-logos">
            <span>Spotify</span>
            <span className="dot">•</span>
            <span>Google</span>
            <span className="dot">•</span>
            <span>Olistic</span>
          </div>
          <button className="button-primary">Ver todos los casos</button>
        </div>
        <div className="cases-image-wrapper">
          <img src="/olistic_case.png" alt="Olistic Success Case" className="cases-img" />
          <div className="cases-image-overlay">
            <span className="tag">Beauty & Health</span>
            <h3>Olistic</h3>
            <p>Incremento del 300% en ROAS</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessCases;
