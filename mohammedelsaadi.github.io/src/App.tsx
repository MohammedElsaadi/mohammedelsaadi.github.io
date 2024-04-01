import React, { ChangeEvent, useEffect } from 'react';
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
        <div className="tab aboutme">
          <h1>About Me</h1>
          <img src={Mohammed_ElSaadi_Photo} alt="My Photo" className="my-photo" />
          <h3>Software Developer | Full‑Stack Developer | Tech Lead</h3>
          {/* <ul>
            <li>
              Software Developer
            </li>
            <li>
              Full-Stack Web Developer
            </li>
            <li>
              Tech Lead
            </li>
          </ul> */}
          {/* <p>Hello! My name is <strong>Mohammed El-Saadi</strong>, a software professional with 6 years of industry experience.</p>
          <p>I have grown my skills in a variety of amazing technologies due to a strong focus on projects from innovative augmented reality applications to full-stack web app development.</p>
          <p>As a tech lead I have managed projects and team members to achieve bringing creative ideas to life.</p>
          <p>I love to talk about my projects and experience. Do not hesitate to contact me and ask any questions!</p> */}
          <p>Hi! I'm <strong>Mohammed El‑Saadi</strong>, a software professional with a solid 6 years of industry experience.</p>
<p>My tech journey has been filled with exciting opportunities, allowing me to delve into various cutting‑edge technologies, from innovative augmented reality applications to comprehensive full‑stack web development projects.</p>
<p>In my role as a tech lead, I've had the privilege of overseeing projects and collaborating closely with team members to transform creative concepts into tangible solutions.</p>
<p>I'm always eager to discuss my projects and experiences, so please don't hesitate to get in touch if you have any questions!</p>          </div>

          <input value="option2" checked={selectedValue === 'option2'} onChange={handleChange} type="radio" name="tabs" id="tab2"></input>
        <label htmlFor="tab2">Skills</label>
        <div className="tab">
          <h1>Skills</h1>
          <p>my skills</p>
        </div>

        <input value="option3" checked={selectedValue === 'option3'} onChange={handleChange} type="radio" name="tabs" id="tab3"></input>
        <label htmlFor="tab3">Projects</label>
        <div className="tab projects">
          <h1>Projects</h1>
          <div className='project'>
            <h3>ViewAR</h3>
            <h4>Augmented Reality (AR) application utilized for employee training</h4>
            <p>Spearheaded the development of this project over 4 years while working as the Lead Software Developer at Datarealm Inc.</p>
            <p>Created an innovative augmented reality application for Microsoft's Hololens device by utilizing a full-stack to connect holographic UI front-end together with a data serving back-end TCP server.</p>
            <p>Incorporated image tracking technology to locate and identify images with camera.</p>
            <p>Approved by Ford Motor Company to conduct training within their facility, training new workers on a line of 10 engine factory stations.</p>
            <p>Workers wearing AR device could see and interact with 3D holograms in their workspace to provide them guidance and information.</p>
            <p>Workers trained with this tool exhibited improved results for retention and cycle times as compared to control group.</p>
            <p>Utilizing C#, .NET, SQL, ASP.NET, Microsoft Server, IIS, and Visual Basic for the full-stack tech stack.</p>
          </div>
          <div className='project'>
            <h3>ARAM ZOO</h3>
            <h4>10-person champion roller for custom ARAM League of Legends games</h4>
            <p>Created to solve personal problems I was having along with my friend group.</p>
            <p>Solved the problem of custom games not having 're-roll' options.</p>
            <p>Also solves problem of having to rely on honor system for champion picks.</p>
            <p>This web application creates random pools of champions based on team member's champion ownership pool, and correctly handles duplicate results.</p>
            <p>Provides optional re-roll options to the team champion pool based on set number of re-rolls.</p>
            <p>Utilizes React, Typescript, JavaScript, HTML, CSS, JSX for the tech stack.</p>  
          </div>
        </div>

        <input value="option4" checked={selectedValue === 'option4'} onChange={handleChange} type="radio" name="tabs" id="tab4"></input>
        <label htmlFor="tab4">Contact</label>
        <div className="tab">
          <h1>Contact</h1>
          <div className='contact'>
            <div>
              <p>Email:</p>
              <p>mohammedelsaadi@gmail.com</p>
            </div>
            <div>
              <p>LinkedIn:</p>
              <p className='linkedin'><a href='https://www.linkedin.com/in/moelsaadi/'>https://www.linkedin.com/in/moelsaadi/</a></p>
            </div>
            <div>
              <p>phone:</p>
              <p>+1(226)787-2414</p>
            </div>
          </div>
        </div>

        <input value="option5" checked={selectedValue === 'option5'} onChange={handleChange} type="radio" name="tabs" id="tab5"></input>
        <label htmlFor="tab5">Resume</label>
        <div className="tab">
          <h1>Resume</h1>
          <a href="/Mohammed El-Saadi Resume.pdf" target='_blank'>click here to open my resume</a>
        </div>
      </div>
    </div>
  );
}

export default App;
