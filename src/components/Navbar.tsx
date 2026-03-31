import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container container">
        <div className="navbar-logo">
          <a href="#">Ahead of <span>Digital</span></a>
        </div>
        <ul className="navbar-links">
          <li><a href="#services">Servicios</a></li>
          <li><a href="#cases">Casos de éxito</a></li>
          <li><a href="#about">Nosotros</a></li>
          <li><a href="#locations">Sedes</a></li>
        </ul>
        <div className="navbar-cta">
          <a href="#contact" className="button-primary">Hablemos</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
