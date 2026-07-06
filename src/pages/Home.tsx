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
      <About />
      <Resume />
      <Projects />
      <Contact />
      <Murphy/>
    </>
  );
}

export default Home;