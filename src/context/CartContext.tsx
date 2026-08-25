import React, { createContext, useContext, useState, useEffect } from 'react';
import { ListingFull, ListingVariant } from '@daloa/types';
import { Haptics } from '@daloa/utils';

export interface CartItem {
  id: string; // composite key: listingId + (variantId || '')
  listing: ListingFull;
  variant?: ListingVariant | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addToCart: (listing: ListingFull, variant?: ListingVariant | null, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce((sum, item) => {
    const unitPrice = item.variant?.price ?? item.listing.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  const addToCart = (listing: ListingFull, variant?: ListingVariant | null, quantity = 1) => {
    Haptics.success();
    const itemId = `${listing.id}_${variant?.id || 'base'}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { id: itemId, listing, variant: variant || null, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    Haptics.lightImpact();
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    Haptics.selection();
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé au sein d’un CartProvider');
  }
  return context;
};
