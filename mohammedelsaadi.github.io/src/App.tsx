import React, { ChangeEvent } from 'react';
import './App.css';
import Mohammed_ElSaadi_Photo from './Mohammed_ElSaadi_Photo.jpg'
import { useState } from 'react';


function App() {
  const [selectedValue, setSelectedValue] = useState('option1');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  return (
    <div className="App">
      <div className="tabs">
        <input value="option1" checked={selectedValue === 'option1'} onChange={handleChange} type="radio" name="tabs" id="tab1"></input>
        <label htmlFor="tab1">About Me</label>
        <div className="tab">
          <h1>About Me</h1>
          <img src={Mohammed_ElSaadi_Photo} alt="My Photo" className="my-photo" />
          <p>Hello! My name is Mohammed El-Saadi, a software developer and tech lead with 6 years of experience.</p>
          <p>Always aiming to bring my creativity and passion for learning to the table in order to bring ideas to life.</p>
          <p>Strong focus on a variety of amazing technologies from augmented reality projects to full-stack web application development.</p>
          <p>Love talking about my projects and experience. Do not hesitate to contact me and ask questions as you learn more about me here!</p>
          </div>

        <input value="option2" checked={selectedValue === 'option2'} onChange={handleChange} type="radio" name="tabs" id="tab2"></input>
        <label htmlFor="tab2">Projects</label>
        <div className="tab">
          <h1>Projects</h1>
          <h3>Augmented Reality (AR)</h3>
          <p>Created an innovative augmented reality application for Microsoft's Hololens device by utilizing a full-stack to connect holographic UI front-end to a data serving back-end TCP server.</p>
          <p>Approved by Ford Motor Company to conduct training within their facility, training new workers on a line of 10 engine factory stations.</p>
          <p>Workers wearing AR device could see and interact with 3D holograms in their workspace to provide them guidance and information.</p>
          <p>Workers trained with this tool exhibited improved results for retention and cycle times as compared to control group.</p>
        </div>

        <input value="option3" checked={selectedValue === 'option3'} onChange={handleChange} type="radio" name="tabs" id="tab3"></input>
        <label htmlFor="tab3">Contact</label>
        <div className="tab">
          <h1>Contact Me</h1>
          <p>contact info</p>
        </div>

        <input value="option4" checked={selectedValue === 'option4'} onChange={handleChange} type="radio" name="tabs" id="tab4"></input>
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
