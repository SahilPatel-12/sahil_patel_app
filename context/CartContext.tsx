import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { safeStorage } from '../services/storage';
import { useLanguage } from './LanguageContext';

const ALL_PRODUCT_METADATA: Record<string, {
  offerPrice: number;
  isDeliverable: boolean;
}> = {
  '1': { offerPrice: 1, isDeliverable: false },
  '2': { offerPrice: 1, isDeliverable: false },
  '3': { offerPrice: 1, isDeliverable: false },
  '4': { offerPrice: 1, isDeliverable: false },
  '5': { offerPrice: 1, isDeliverable: false },
  '6': { offerPrice: 1, isDeliverable: false },
  '7': { offerPrice: 1, isDeliverable: false },
  '8': { offerPrice: 1, isDeliverable: false },
  'p4': { offerPrice: 599, isDeliverable: true },
  'p5': { offerPrice: 399, isDeliverable: true },
  'p6': { offerPrice: 120, isDeliverable: true },
  'p7': { offerPrice: 99, isDeliverable: true },
  'p8': { offerPrice: 89, isDeliverable: true },
  'rec_1': { offerPrice: 279, isDeliverable: true },
  'rec_2': { offerPrice: 32, isDeliverable: true },
  'rec_3': { offerPrice: 21, isDeliverable: true },
  'add_1': { offerPrice: 224, isDeliverable: true },
};

const getMetadata = (id: string) => {
  return ALL_PRODUCT_METADATA[id] || { offerPrice: 1, isDeliverable: false };
};

interface CartContextType {
  cart: Record<string, number>;
  handleAddToCart: (id: string) => void;
  handleIncrement: (id: string) => void;
  handleDecrement: (id: string) => void;
  clearCart: () => void;
  totalCartCount: number;
  user: any;
  refreshSession: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();

  const syncCartToSupabase = async (userId: string, currentCart: Record<string, number>) => {
    try {
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let cartId = cartData?.id;
      if (!cartId) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (newCartError) {
          console.error('Error creating cart in Supabase:', newCartError);
          return;
        }
        cartId = newCart?.id;
      }

      // Delete existing items for a clean replacement
      await supabase.from('cart_items').delete().eq('cart_id', cartId);

      const itemsToInsert = Object.keys(currentCart).map(id => {
        const meta = getMetadata(id);
        return {
          cart_id: cartId,
          item_type: meta.isDeliverable ? 'product' : 'puja',
          item_id: id,
          quantity: currentCart[id],
          price: meta.offerPrice
        };
      });

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert(itemsToInsert);
        if (insertError) {
          console.error('Error inserting cart items in Supabase:', insertError);
        }
      }
    } catch (err) {
      console.error('Error syncing cart to Supabase:', err);
    }
  };

  const loadAndMergeCart = async (userId: string, guestCart: Record<string, number>) => {
    try {
      let { data: cartData } = await supabase
        .from('carts')
        .select('id, cart_items(item_id, quantity)')
        .eq('user_id', userId)
        .maybeSingle();

      const mergedCart = { ...guestCart };
      if (cartData?.cart_items) {
        cartData.cart_items.forEach((item: any) => {
          mergedCart[item.item_id] = (mergedCart[item.item_id] || 0) + item.quantity;
        });
      }

      await syncCartToSupabase(userId, mergedCart);
      setCart(mergedCart);
    } catch (err) {
      console.error('Error loading/merging cart:', err);
    }
  };

  const refreshSession = async () => {
    try {
      const sessionData = await safeStorage.getItem('user_session');
      if (sessionData) {
        const parsedUser = JSON.parse(sessionData);
        setUser((prevUser: any) => {
          if (!prevUser || prevUser.id !== parsedUser.id) {
            loadAndMergeCart(parsedUser.id, cart);
            return parsedUser;
          }
          return prevUser;
        });
      } else {
        setUser((prevUser: any) => {
          if (prevUser !== null) {
            setCart({});
            return null;
          }
          return prevUser;
        });
      }
    } catch (err) {
      console.error('Error checking user session in CartContext:', err);
    }
  };

  useEffect(() => {
    refreshSession();
    const interval = setInterval(refreshSession, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (id: string) => {
    if (!user) {
      router.push({ pathname: '/login', params: { redirectTo: '/cart' } });
      return;
    }
    setCart(prev => {
      const updated = { ...prev, [id]: 1 };
      if (user) {
        syncCartToSupabase(user.id, updated);
      }
      return updated;
    });
  };

  const handleIncrement = (id: string) => {
    if (!user) {
      router.push({ pathname: '/login', params: { redirectTo: '/cart' } });
      return;
    }
    setCart(prev => {
      const updated = { ...prev, [id]: (prev[id] || 0) + 1 };
      if (user) {
        syncCartToSupabase(user.id, updated);
      }
      return updated;
    });
  };

  const handleDecrement = (id: string) => {
    if (!user) return;
    setCart(prev => {
      const updated = { ...prev };
      const newQty = (updated[id] || 0) - 1;
      if (newQty <= 0) {
        delete updated[id];
      } else {
        updated[id] = newQty;
      }
      if (user) {
        syncCartToSupabase(user.id, updated);
      }
      return updated;
    });
  };

  const clearCart = async () => {
    setCart({});
    if (user) {
      await syncCartToSupabase(user.id, {});
    }
  };

  const totalCartCount = Object.values(cart).reduce((sum, val) => sum + val, 0);

  return (
    <CartContext.Provider value={{ cart, handleAddToCart, handleIncrement, handleDecrement, clearCart, totalCartCount, user, refreshSession }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
