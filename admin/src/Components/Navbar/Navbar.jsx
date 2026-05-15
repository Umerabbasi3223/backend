import React from 'react'
import './Navbar.css'
import navProfile from '../../assets/admin_profile.jpg'
import navlogo from '../../assets/ua_icon.png'

const Navbar = () => {
  return (
    <div className='navbar'>
     <img src={navlogo} alt="Logo" className='nav-logo'/>
     <img src={navProfile} alt="Admin Profile" className='nav-profile'/> 
    </div>
  )
}

export default Navbar
