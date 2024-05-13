import React, { ChangeEvent, useEffect } from 'react';
import './App.css';
import Mohammed_ElSaadi_Photo from './Mohammed Elsaadi Photo Square.png'
import Clouds from './clouds.png'
import { useState } from 'react';
import photoofme from "../public/photoofme.png"


function App() {
  const [selectedValue, setSelectedValue] = useState('option1');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const myStlye = {
    backgroundImage: `url(${Mohammed_ElSaadi_Photo})`
  }
  return (
    <div className="App">
      <body>
        <div className='Hero'>
              <img className='selfie' src={Mohammed_ElSaadi_Photo} ></img>
            
            <div className='texts'>
              <div className='name'><span>Mohammed El-Saadi</span></div>
              <div className='title'><span>Full-Stack Developer</span></div>
              <div className='title'><span>Tech Lead</span></div>
              <div className='title'><span>Freelancer</span></div>
              <div className='buttons'>
              <a href="#About">About Me</a>
              <a href="#Projects">Projects</a>
              <a href="#Contact">Contact Me</a>
            </div>
            </div>

            <div className='scroll-indicator'>

              <span className="scroll-text">Scroll down</span>
            </div>
        </div>
        <section id="About">
          <button>Hello</button>
        </section>
      </body>
    </div>

  );
}

export default App;
