import './Locations.css';

const locations = [
  { name: "Madrid", img: "/city_madrid.png" },
  { name: "Barcelona", img: "/city_barcelona.png" },
  { name: "Bilbao", img: "/city_bilbao.png" }
];

const Locations = () => {
  return (
    <section id="locations" className="locations-section container">
      <div className="locations-header">
        <h2>Sedes</h2>
        <p>Dónde nos encontramos</p>
      </div>
      
      <div className="locations-grid">
        {locations.map((loc, index) => (
          <div key={index} className="location-card">
            <img src={loc.img} alt={`Oficina en ${loc.name}`} />
            <div className="location-overlay">
              <h3>{loc.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Locations;
