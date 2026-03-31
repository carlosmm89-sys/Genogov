import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ClientMarquee from './components/ClientMarquee';
import Services from './components/Services';
import SuccessCases from './components/SuccessCases';
import Locations from './components/Locations';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ClientMarquee />
        <Services />
        <SuccessCases />
        <Locations />
      </main>
      <Footer />
    </>
  );
}

export default App;
