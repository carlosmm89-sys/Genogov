import './Services.css';

const services = [
  {
    title: "Media",
    description: "Maximiza tu inversión publicitaria con estrategias basadas en datos y algoritmos predictivos.",
    tags: ["Paid Search", "Social Ads", "Programmatic"]
  },
  {
    title: "Performance",
    description: "Optimizamos cada punto de contacto para incrementar drásticamente tus ratios de conversión.",
    tags: ["CRO", "UX/UI", "A/B Testing"]
  },
  {
    title: "Strategy",
    description: "Construimos hojas de ruta digitales que posicionan tu marca en la vanguardia de tu industria.",
    tags: ["Consulting", "Branding", "Go-to-Market"]
  }
];

const Services = () => {
  return (
    <section id="services" className="services-section container">
      <div className="services-header">
        <h2>Mis grandes<br/><span>áreas de experiencia.</span></h2>
        <div className="services-actions">
          <button className="button-secondary">Ver todo</button>
        </div>
      </div>
      
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card glass-panel">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="service-tags">
              {service.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <a href="#" className="service-link">Saber más &rarr;</a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
