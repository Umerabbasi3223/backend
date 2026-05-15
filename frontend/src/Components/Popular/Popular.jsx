// Popular.js - UPDATED VERSION with backend connection
import React, { useState, useEffect } from 'react'
import './Popular.css'
import Item from '../Item/Item'

const Popular = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:4000/products')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.products) {
          // Get 8 random popular products (in real app, you might have a "popular" field)
          const popularProducts = [...data.products]
            .filter(product => product.category === 'women') // Filter by category
            .slice(0, 8)
          
          setProducts(popularProducts)
        } else {
          throw new Error(data.message || 'Invalid response from server')
        }
      } catch (err) {
        console.error('Error fetching popular products:', err)
        setError('Failed to load popular products')
      } finally {
        setLoading(false)
      }
    }

    fetchPopularProducts()
  }, [])

  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000'
  const resolveImage = (img) => {
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('/')) return `${API}${img}`
    return `${API}/images/${img}`
  }

  if (loading) {
    return (
      <div className="popular">
        <h1>POPULAR IN WOMEN</h1>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="popular">
        <h1>POPULAR IN WOMEN</h1>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="popular">
      <h1>POPULAR IN WOMEN</h1>
      <hr />

      <div className="popular_item">
        {products.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            image={resolveImage(item.image)}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  )
}

export default Popular