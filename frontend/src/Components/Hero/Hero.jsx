import React, { useEffect, useState } from 'react'
import './Hero.css'
import hand_icon from '../Assets/hand_icon.png'
import arrow_icon from '../Assets/arrow.png'
import hero_image from '../Assets/hero_image.png'

const Hero = () => {
  const [heroProduct, setHeroProduct] = useState(null)

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:4000'
    const loadHero = async () => {
      try {
        const res = await fetch(`${API}/products`)
        if (!res.ok) return
        const json = await res.json()
        if (json.products && json.products.length > 0) {
          // pick a product to feature (use highest id or last item)
          const product = json.products.reduce((a, b) => (a.id > b.id ? a : b))
          setHeroProduct(product)
        }
      } catch (err) {
        console.error('Failed to load hero product', err)
      }
    }
    loadHero()
  }, [])

  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000'
  const resolveImage = (img) => {
    if (!img) return hero_image
    if (typeof img !== 'string') return hero_image
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('/')) return `${API}${img}`
    if (img.includes('/images/')) return img.includes('http') ? img : `${API}${img.startsWith('/') ? '' : '/'}${img}`
    // assume it's a filename stored in upload/images
    return `${API}/images/${img}`
  }

  const imageSrc = heroProduct?.image ? resolveImage(heroProduct.image) : hero_image
  const title = heroProduct?.name || 'New Arrival Only'
  const subtitle = heroProduct?.category || 'Latest Collection'

  return (
    <div className='hero'>
      <div className="hero-left">
        <h2>{title}</h2>
        <div className="hero-text-container">
          <div className="hero-hand-icon">
            <p>new</p>
            <img src={hand_icon} alt="waving hand"/>
          </div>
          <p>{subtitle}</p>
          <p>for everyone</p>
        </div>
        <div className="hero-latest-btn">
          <div>Latest Collection</div>
          <img src={arrow_icon} alt="arrow icon"/>
        </div>
      </div>
      <div className="hero-right">
        <img src={imageSrc} alt={title}/>
      </div>
    </div>
  )
}

export default Hero