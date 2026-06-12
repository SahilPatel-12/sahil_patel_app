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

const fetchDbItemMetadata = async (id: string) => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  if (!isUuid) return null;

  try {
    const [oneRupee, general, website, problem, offer, daily] = await Promise.all([
      supabase.from('one_rupee_poojas').select('id, title, original_price, offer_price, provider, image_url').eq('id', id).maybeSingle(),
      supabase.from('general_poojas').select('id, title, original_price, offer_price, provider, image_url').eq('id', id).maybeSingle(),
      supabase.from('website_pooja_products').select('id, name, original_price, price, subtitle, temple_association, image').eq('id', id).maybeSingle(),
      supabase.from('problem_poojas').select('id, title, original_price, offer_price, provider, image_url').eq('id', id).maybeSingle(),
      supabase.from('offer_pujas').select('id, title, price, discounted_price, thumbnail_url').eq('id', id).maybeSingle(),
      supabase.from('daily_pujas').select('id, title, price, discounted_price, thumbnail_url').eq('id', id).maybeSingle()
    ]);

    if (oneRupee.data) {
      const d = oneRupee.data;
      return {
        title: d.title,
        subtitle: d.provider || 'One Rupee Store',
        originalPrice: parseFloat(String(d.original_price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.offer_price).replace(/[^0-9.]/g, '')) || 1,
        image: d.image_url ? { uri: d.image_url } : require('../assets/God/god.png'),
        isDeliverable: false,
      };
    }
    if (general.data) {
      const d = general.data;
      return {
        title: d.title,
        subtitle: d.provider || 'Vedic Shrine',
        originalPrice: parseFloat(String(d.original_price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.offer_price).replace(/[^0-9.]/g, '')) || 0,
        image: d.image_url ? { uri: d.image_url } : require('../assets/God/god.png'),
        isDeliverable: false,
      };
    }
    if (website.data) {
      const d = website.data;
      return {
        title: d.name,
        subtitle: d.subtitle || d.temple_association || 'Store Product',
        originalPrice: parseFloat(String(d.original_price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.price).replace(/[^0-9.]/g, '')) || 0,
        image: d.image ? (typeof d.image === 'string' && d.image.startsWith('http') ? { uri: d.image } : d.image) : require('../assets/God/god.png'),
        isDeliverable: true,
      };
    }
    if (problem.data) {
      const d = problem.data;
      return {
        title: d.title,
        subtitle: d.provider || 'Vedic Shrine',
        originalPrice: parseFloat(String(d.original_price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.offer_price).replace(/[^0-9.]/g, '')) || 0,
        image: d.image_url ? { uri: d.image_url } : require('../assets/God/god.png'),
        isDeliverable: false,
      };
    }
    if (offer.data) {
      const d = offer.data;
      return {
        title: d.title,
        subtitle: 'Special Offer Puja',
        originalPrice: parseFloat(String(d.price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.discounted_price).replace(/[^0-9.]/g, '')) || 0,
        image: d.thumbnail_url ? { uri: d.thumbnail_url } : require('../assets/God/god.png'),
        isDeliverable: false,
      };
    }
    if (daily.data) {
      const d = daily.data;
      return {
        title: d.title,
        subtitle: 'Daily Ritual',
        originalPrice: parseFloat(String(d.price).replace(/[^0-9.]/g, '')) || 0,
        offerPrice: parseFloat(String(d.discounted_price).replace(/[^0-9.]/g, '')) || 0,
        image: d.thumbnail_url ? { uri: d.thumbnail_url } : require('../assets/God/god.png'),
        isDeliverable: false,
      };
    }
  } catch (err) {
    console.error('Error fetching dynamic metadata:', err);
  }
  return null;
};

interface CartContextType {
  cart: Record<string, number>;
  dbMetadata: Record<string, {
    title: string;
    subtitle: string;
    originalPrice: number;
    offerPrice: number;
    image: any;
    isDeliverable: boolean;
  }>;
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
  const [dbMetadata, setDbMetadata] = useState<Record<string, {
    title: string;
    subtitle: string;
    originalPrice: number;
    offerPrice: number;
    image: any;
    isDeliverable: boolean;
  }>>({});
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();

  const fetchMissingMetadata = async (ids: string[]) => {
    const missingIds = ids.filter(id => {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      return isUuid && !dbMetadata[id];
    });

    if (missingIds.length === 0) return;

    const newMeta: Record<string, any> = {};
    await Promise.all(missingIds.map(async (id) => {
      const fetched = await fetchDbItemMetadata(id);
      if (fetched) {
        newMeta[id] = fetched;
      }
    }));

    if (Object.keys(newMeta).length > 0) {
      setDbMetadata(prev => ({ ...prev, ...newMeta }));
    }
  };

  useEffect(() => {
    const ids = Object.keys(cart);
    if (ids.length > 0) {
      fetchMissingMetadata(ids);
    }
  }, [cart]);

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

      const itemsToInsert = await Promise.all(Object.keys(currentCart).map(async (id) => {
        let meta = ALL_PRODUCT_METADATA[id];
        let offerPrice = meta?.offerPrice;
        let isDeliverable = meta?.isDeliverable;

        if (!meta && dbMetadata[id]) {
          offerPrice = dbMetadata[id].offerPrice;
          isDeliverable = dbMetadata[id].isDeliverable;
        }

        if (offerPrice === undefined) {
          const fetched = await fetchDbItemMetadata(id);
          if (fetched) {
            offerPrice = fetched.offerPrice;
            isDeliverable = fetched.isDeliverable;
            setDbMetadata(prev => ({ ...prev, [id]: fetched }));
          } else {
            offerPrice = 1;
            isDeliverable = false;
          }
        }

        return {
          cart_id: cartId,
          item_type: isDeliverable ? 'product' : 'puja',
          item_id: id,
          quantity: currentCart[id],
          price: offerPrice
        };
      }));

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
    <CartContext.Provider value={{ cart, dbMetadata, handleAddToCart, handleIncrement, handleDecrement, clearCart, totalCartCount, user, refreshSession }}>
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
