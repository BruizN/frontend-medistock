import { useState, useEffect } from 'react';
import './index.css';

const API_URL = 'http://localhost:8000/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        if (res.status === 401) logout();
      }
    } catch (err) {
      setError('Error connecting to API');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        // Register flow
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'client' })
        });
        
        if (res.ok) {
          // Auto login after register
          await login(email, password);
        } else {
          const data = await res.json();
          setError(data.detail || 'Registration failed.');
        }
      } else {
        // Login flow
        await login(email, password);
      }
    } catch (err) {
      setError('Error connecting to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginEmail, loginPassword) => {
    const formData = new URLSearchParams();
    formData.append('username', loginEmail);
    formData.append('password', loginPassword);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    } else {
      setError('Invalid credentials.');
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setCart([]);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      
      const data = await res.json();
      if (res.ok && data.url && data.token) {
        // Create a form to POST to Webpay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      } else {
        setError(data.detail || 'Checkout failed');
      }
    } catch (err) {
      setError('Checkout error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container glass-panel">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>MEDISTOCK Portal</h2>
        {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleAuth}>
          <input 
            type="email" 
            placeholder="Email (e.g. admin@medistock.com)" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password (e.g. Gamer_2026)" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <button 
            className="secondary" 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
            style={{ width: '100%' }}
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  if (window.location.pathname === '/payment/callback') {
    const searchParams = new URLSearchParams(window.location.search);
    const token_ws = searchParams.get('token_ws') || new URLSearchParams(window.location.hash.substring(1)).get('token_ws');
    
    // Sometimes Webpay does a POST back. If it's a POST, we'd need the backend to handle the redirect to frontend with query params.
    // For this simple mock/sandbox, we'll assume the token is in URL or we just show a generic success if we can't parse it.
    
    return (
      <div className="auth-container glass-panel" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Payment Processed!</h2>
        <p>Your transaction has been received. In a real environment, we would validate token: {token_ws || 'N/A'} here.</p>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: '2rem' }}>Return to Catalog</button>
      </div>
    );
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="app-container">
      <header>
        <h1>MEDISTOCK</h1>
        <div>
          <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>Total: ${cartTotal.toLocaleString('es-CL')}</span>
          <button className="secondary" onClick={logout}>Sign Out</button>
        </div>
      </header>

      {error && <div style={{ color: 'var(--error)', padding: '1rem', background: '#ffe6e6', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <div className="grid">
        {products.map(product => (
          <div key={product.id} className="glass-panel product-card">
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>{product.code}</span>
              <h3>{product.name}</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{product.description || 'No description available.'}</p>
              <div className="price">${product.price.toLocaleString('es-CL')}</div>
            </div>
            <button onClick={() => addToCart(product)} disabled={product.stock <= 0}>
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
        {products.length === 0 && !loading && (
          <p>No products available. Add some using the API or check connection.</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart glass-panel">
          <h2 style={{ marginBottom: '1rem' }}>Your Cart</h2>
          {cart.map((item, i) => (
            <div key={i} className="cart-item">
              <div>
                <strong>{item.name}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toLocaleString('es-CL')}</div>
            </div>
          ))}
          <button onClick={checkout} disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Processing...' : `Checkout Webpay ($${cartTotal.toLocaleString('es-CL')})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
