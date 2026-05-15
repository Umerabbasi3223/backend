
import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'

const Item = (props) => {
  return (
    <div className='item'>
      <Link to={`/product/${props.id}`}><img onClick={window.scrollTo(0,0)} src={props.image} alt={props.name} className="item-image" /></Link>

      <p className="item-name">{props.name}</p>

      <div className="item-price">
        <div className="item-new-price">
          Rs {props.new_price}
        </div>

        <div className="item-old-price">
          Rs {props.old_price}
        </div>
      </div>
    </div>
  )
}

export default Item;