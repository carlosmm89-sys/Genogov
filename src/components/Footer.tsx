import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="newsletter-container container">
        <div className="newsletter-content">
          <h2>Únete a la newsletter</h2>
          <p>Recibe contenido exclusivo sobre tendencias, estrategias digitales y casos reales en tu bandeja de entrada.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Tu correo electrónico" required />
            <button type="submit" className="button-primary">Suscribirse</button>
          </form>
        </div>
      </div>
      
      <div className="footer-bottom container">
        <div className="footer-logo">
          <h2>Ahead of <span>Digital</span></h2>
          <p>Agencia global de marketing y tecnología.</p>
        </div>
        
        <div className="footer-links">
          <div className="link-column">
            <h4>Servicios</h4>
            <ul>
              <li><a href="#">Media</a></li>
              <li><a href="#">Performance</a></li>
              <li><a href="#">Strategy</a></li>
              <li><a href="#">Data & Tech</a></li>
            </ul>
          </div>
          <div className="link-column">
            <h4>Compañía</h4>
            <ul>
              <li><a href="#">Sobre Nosotros</a></li>
              <li><a href="#">Casos de Éxito</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-legal container">
        <p>&copy; {new Date().getFullYear()} Ahead of Digital. Todos los derechos reservados.</p>
        <div className="legal-links">
          <a href="#">Aviso Legal</a>
          <a href="#">Política de Privacidad</a>
          <a href="#">Redes Sociales</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
