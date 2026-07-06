import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Contact from '../components/Contact';
import Resume from '../components/Resume';
import { Murphy } from '../components/Murphy';

function Home () {
  return (
       <>
      <Hero />
      <div className="h-1 bg-black" />
      <About />
      <div className="h-1 bg-black" />
      <Projects />
      <div className="h-1 bg-black" />
      <Resume />
      <div className="h-1 bg-black" />
      <Contact />
      <div className="h-1 bg-black" />
      <Murphy/>
    </>
  );
}

export default Home;