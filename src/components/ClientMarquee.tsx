import './ClientMarquee.css';

const clients = [
  "Google", "Spotify", "Nike", "Apple", "Amazon", "Microsoft", "Netflix", "Meta"
];

const ClientMarquee = () => {
  return (
    <section className="marquee-section">
      <div className="marquee-header container">
        <p>200+ COMPAÑÍAS CONFÍAN EN NOSOTROS</p>
      </div>
      <div className="marquee-container">
        <div className="marquee-track">
          {/* Duplicate set for infinite loop */}
          {[...clients, ...clients, ...clients].map((client, idx) => (
            <div key={idx} className="marquee-item">
              <span>{client}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientMarquee;
