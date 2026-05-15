import React, { useState, useEffect } from 'react'
import './Offers.css'
import exclusive_image from '../Assets/exclusive_image.png'

const Offers = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const { hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          return { ...prev, seconds: seconds - 1 }
        } else if (minutes > 0) {
          return { hours, minutes: minutes - 1, seconds: 59 }
        } else if (hours > 0) {
          return { hours: hours - 1, minutes: 59, seconds: 59 }
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className='offers'>
      <div className="offer-left">
        <h1>Exclusive</h1>
        <h1>Offers For You</h1>
        <p>ONLY ON BEST SELLER PRODUCTS</p>
        
        <div className="offer-timer">
          <div className="timer-box">
            <div className="timer-value">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="timer-label">Hours</div>
          </div>
          <div className="timer-box">
            <div className="timer-value">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="timer-label">Minutes</div>
          </div>
          <div className="timer-box">
            <div className="timer-value">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="timer-label">Seconds</div>
          </div>
        </div>
        
        <button>Check Now</button>
      </div>

      <div className="offer-right">
        <img src={exclusive_image} alt="Exclusive offer product" />
      </div>
    </div>
  );
};

export default Offers;