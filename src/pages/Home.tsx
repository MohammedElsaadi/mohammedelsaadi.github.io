import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Contact from '../components/Contact';
import Resume from '../components/Resume';

function Home () {
  return (
       <>
      <Hero />
      <About />
      <Resume />
      <Projects />
      <Contact />
    </>
  );
}

export default Home;