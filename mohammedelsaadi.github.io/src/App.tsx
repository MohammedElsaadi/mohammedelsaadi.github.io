import React from 'react';
import './App.css';
import Mohammed_ElSaadi_Photo from './Mohammed_ElSaadi_Photo.jpg'


function App() {
  return (
    <div className="App">
      <div className="tabs">
        <input type="radio" name="tabs" id="tab1" checked></input>
        <label htmlFor="tab1">About Me</label>
        <div className="tab">
          <h1>About Me</h1>
          <img src={Mohammed_ElSaadi_Photo} alt="My Photo" className="my-photo" />
          <p>Hello! My name is Mohammed El-Saadi and I am a software developer!</p>
          <p>I love to work on creative and innovate projects. I have worked in research and development as well as dedicated full-stack development and always bring my passion to drive solutions forward.</p>
        </div>

        <input type="radio" name="tabs" id="tab2"></input>
        <label htmlFor="tab2">Projects</label>
        <div className="tab">
          <h1>Projects</h1>
          <p>projects ive done</p>
        </div>

        <input type="radio" name="tabs" id="tab3"></input>
        <label htmlFor="tab3">Contact</label>
        <div className="tab">
          <h1>Contact Me</h1>
          <p>contact info</p>
        </div>

        <input type="radio" name="tabs" id="tab4"></input>
        <label htmlFor="tab4">Resume</label>
        <div className="tab">
          <h1>Resume</h1>
          <p>My Resume</p>
        </div>
      </div>
    </div>
  );
}

export default App;
