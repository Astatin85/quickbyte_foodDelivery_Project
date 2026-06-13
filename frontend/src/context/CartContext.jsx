import React, { useState, useEffect, useContext, createContext } from 'react';

// Cart context
const CartContext = createContext({ cart: [], addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {}, total: 0 });

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qb_cart')) || []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('qb_cart', JSON.stringify(cart)); }, [cart]);
  const addToCart = (item, restaurantId) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.item_id);
      if (existing) return prev.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, restaurant_id: restaurantId }];
    });
  };
  const removeFromCart = (item_id) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item_id);
      if (existing?.quantity === 1) return prev.filter(i => i.item_id !== item_id);
      return prev.map(i => i.item_id === item_id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };
  const clearCart = () => setCart([]);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>{children}</CartContext.Provider>;
}

