import React, { useState } from 'react'
import './NewsLetter.css'

const NewsLetter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      return
    }

    setStatus('loading')
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success')
      setEmail('')
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    }, 1500)
  }

  return (
    <div className={`newsletter ${status}`}>
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newsletter and stay updated</p>

      <form onSubmit={handleSubmit} className="newsletter-box">
        <input 
          type="email" 
          placeholder="Enter Email Id" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Subscribing...' : 
           status === 'success' ? 'Subscribed!' : 'Subscribe'}
        </button>
      </form>
      
      {status === 'error' && (
        <div className="error-message">Please enter a valid email address</div>
      )}
    </div>
  )
}

export default NewsLetter