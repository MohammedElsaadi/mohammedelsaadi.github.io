import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import { Murphy } from '../components/Murphy';
import ResumeContact from '../components/ResumeContact';

function Home () {
  return (
       <>
      <Hero />
      <div className="h-1 bg-black" />
      <About />
      <div className="h-1 bg-black" />
      <Projects />
      <div className="h-1 bg-black" />
      <ResumeContact />
      <div className="h-1 bg-black" />
      <Murphy/>
    </>
  );
}

export default Home;