import { useState } from 'react'
import { Crop } from './components/Crop'
import './style/global.scss'
import download from './assets/download.svg'
import crop from './assets/crop.svg'

function App() {
  return (
    <div className='main'>
      <div className="hero">
        <h1>
          Image Cropper.
        </h1>
        <div>
          The online Crop image tool by boon4681.
        </div>
        <div className='group.block'>
          <div className='block'>
            <div className='flipY'>
              <img src={download} alt="" />
            </div>
            <div>
              <div>1. Upload.</div>
              <div className='text'>Upload your JPG or PNG to Crop image tools</div>
            </div>
          </div>
          <div className='block'>
            <div>
              <img src={crop} alt="" />
            </div>
            <div>
              <div>2. Crop.</div>
              <div className='text'>Drag the handles to create your desired crop.</div>
            </div>
          </div>
          <div className='block'>
            <div>
              <img src={download} alt="" />
            </div>
            <div>
              <div>3. Download.</div>
              <div className='text'>Download or Copy your cropped image.</div>
            </div>
          </div>
        </div>
      </div>
      <div className='section.1'>
        <div className='window'>
          <div className='header'>
          </div>
          <div className='body'>
            <Crop></Crop>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
