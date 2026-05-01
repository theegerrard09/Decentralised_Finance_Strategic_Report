import { createContext, useContext, useReducer, useEffect } from 'react';
import { storage, sessionStore } from '../utils/storage';
import { generateId } from '../utils/helpers';

const AppContext = createContext(null);

const SEED_PRODUCTS = [
  { id: 'p1', name: 'Sunlight Soap (3-pack)', category: 'Household', barcode: '6009175955032', buyingPrice: 12, sellingPrice: 18, quantity: 45, lowStockThreshold: 10, createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Coca-Cola 500ml', category: 'Beverages', barcode: '5449000000996', buyingPrice: 4, sellingPrice: 6, quantity: 120, lowStockThreshold: 20, createdAt: new Date().toISOString() },
  { id: 'p3', name: 'Indomie Noodles (Chicken)', category: 'Food', barcode: '8998009011100', buyingPrice: 2.5, sellingPrice: 4, quantity: 8, lowStockThreshold: 15, createdAt: new Date().toISOString() },
  { id: 'p4', name: 'Dettol 500ml', category: 'Health', barcode: '6001106040278', buyingPrice: 22, sellingPrice: 32, quantity: 30, lowStockThreshold: 5, createdAt: new Date().toISOString() },
  { id: 'p5', name: 'Canola Cooking Oil 2L', category: 'Food', barcode: '6003004000176', buyingPrice: 38, sellingPrice: 55, quantity: 5, lowStockThreshold: 8, createdAt: new Date().toISOString() },
];

const SEED_CUSTOMERS = [
  { id: 'c1', name: 'Abena Mensah', phone: '0244123456', email: '', address: 'Kumasi, Ashanti', notes: 'Regular customer', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Kofi Asante', phone: '0277654321', email: '', address: 'Accra, Greater Accra', notes: '', createdAt: new Date().toISOString() },
];

const SEED_SUPPLIERS = [
  { id: 's1', name: 'Ghana Trading Co.', phone: '0302456789', email: 'info@ghanatrade.com', address: 'Accra, Ghana', notes: 'Main supplier for household goods', createdAt: new Date().toISOString() },
  { id: 's2', name: 'Coca-Cola Ghana Ltd', phone: '0302987654', email: 'orders@cokegha.com', address: 'Accra, Ghana', notes: 'Beverages supplier', createdAt: new Date().toISOString() },
];

function createInitialState() {
  const savedProducts = storage.get('products');
  const savedSales = storage.get('sales');
  const savedCredits = storage.get('credits');
  const savedSuppliers = storage.get('suppliers');
  const savedCustomers = storage.get('customers');
  const savedLog = storage.get('activityLog');
  const savedAuth = storage.get('auth');
  const sessionAuth = sessionStore.get('auth');

  return {
    auth: savedAuth || sessionAuth || { isLoggedIn: false, username: '' },
    products: savedProducts ?? SEED_PRODUCTS,
    sales: savedSales ?? [],
    credits: savedCredits ?? [],
    suppliers: savedSuppliers ?? SEED_SUPPLIERS,
    customers: savedCustomers ?? SEED_CUSTOMERS,
    activityLog: savedLog ?? [],
    toast: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const { staySignedIn, username } = action.payload;
      const auth = { isLoggedIn: true, username };
      if (staySignedIn) {
        storage.set('auth', auth);
      } else {
        sessionStore.set('auth', auth);
      }
      return { ...state, auth };
    }
    case 'LOGOUT': {
      storage.remove('auth');
      sessionStore.remove('auth');
      return { ...state, auth: { isLoggedIn: false, username: '' } };
    }

    case 'ADD_PRODUCT': {
      const products = [...state.products, action.payload];
      storage.set('products', products);
      return { ...state, products };
    }
    case 'UPDATE_PRODUCT': {
      const products = state.products.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p
      );
      storage.set('products', products);
      return { ...state, products };
    }
    case 'DELETE_PRODUCT': {
      const products = state.products.filter(p => p.id !== action.payload);
      storage.set('products', products);
      return { ...state, products };
    }
    case 'RESTOCK_PRODUCT': {
      const products = state.products.map(p =>
        p.id === action.payload.id
          ? { ...p, quantity: p.quantity + action.payload.qty, updatedAt: new Date().toISOString() }
          : p
      );
      storage.set('products', products);
      return { ...state, products };
    }

    case 'ADD_SALE': {
      const sale = action.payload;
      const products = state.products.map(p => {
        const item = sale.items.find(i => i.productId === p.id);
        if (item) return { ...p, quantity: Math.max(0, p.quantity - item.quantity), updatedAt: new Date().toISOString() };
        return p;
      });
      const sales = [...state.sales, sale];
      storage.set('sales', sales);
      storage.set('products', products);
      return { ...state, sales, products };
    }

    case 'ADD_CREDIT': {
      const credits = [...state.credits, action.payload];
      storage.set('credits', credits);
      return { ...state, credits };
    }
    case 'UPDATE_CREDIT': {
      const credits = state.credits.map(c =>
        c.id === action.payload.id ? { ...c, ...action.payload } : c
      );
      storage.set('credits', credits);
      return { ...state, credits };
    }
    case 'DELETE_CREDIT': {
      const credits = state.credits.filter(c => c.id !== action.payload);
      storage.set('credits', credits);
      return { ...state, credits };
    }

    case 'ADD_SUPPLIER': {
      const suppliers = [...state.suppliers, action.payload];
      storage.set('suppliers', suppliers);
      return { ...state, suppliers };
    }
    case 'UPDATE_SUPPLIER': {
      const suppliers = state.suppliers.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload } : s
      );
      storage.set('suppliers', suppliers);
      return { ...state, suppliers };
    }
    case 'DELETE_SUPPLIER': {
      const suppliers = state.suppliers.filter(s => s.id !== action.payload);
      storage.set('suppliers', suppliers);
      return { ...state, suppliers };
    }

    case 'ADD_CUSTOMER': {
      const customers = [...state.customers, action.payload];
      storage.set('customers', customers);
      return { ...state, customers };
    }
    case 'UPDATE_CUSTOMER': {
      const customers = state.customers.map(c =>
        c.id === action.payload.id ? { ...c, ...action.payload } : c
      );
      storage.set('customers', customers);
      return { ...state, customers };
    }
    case 'DELETE_CUSTOMER': {
      const customers = state.customers.filter(c => c.id !== action.payload);
      storage.set('customers', customers);
      return { ...state, customers };
    }

    case 'LOG_ACTIVITY': {
      const entry = {
        id: generateId(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      const activityLog = [entry, ...state.activityLog].slice(0, 200);
      storage.set('activityLog', activityLog);
      return { ...state, activityLog };
    }

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const actions = {
    login: (username, password, staySignedIn) => {
      if (username === 'admin' && password === 'gevite2024') {
        dispatch({ type: 'LOGIN', payload: { username, staySignedIn } });
        actions.logActivity('LOGIN', `${username} signed in`);
        return true;
      }
      return false;
    },
    logout: () => dispatch({ type: 'LOGOUT' }),

    addProduct: (data) => {
      const product = { id: generateId(), ...data, createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_PRODUCT', payload: product });
      actions.logActivity('PRODUCT_ADDED', `Added product: ${data.name}`);
      actions.toast('Product added successfully!', 'success');
      return product;
    },
    updateProduct: (id, data) => {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id, ...data } });
      actions.logActivity('PRODUCT_UPDATED', `Updated product: ${data.name || id}`);
      actions.toast('Product updated!', 'success');
    },
    deleteProduct: (id, name) => {
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      actions.logActivity('PRODUCT_DELETED', `Deleted product: ${name}`);
      actions.toast('Product deleted.', 'info');
    },
    restockProduct: (id, qty, name) => {
      dispatch({ type: 'RESTOCK_PRODUCT', payload: { id, qty } });
      actions.logActivity('RESTOCK', `Restocked ${name} by ${qty} units`);
      actions.toast(`Restocked ${qty} units of ${name}!`, 'success');
    },

    addSale: (sale) => {
      const record = { id: generateId(), ...sale, createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_SALE', payload: record });
      actions.logActivity('SALE', `Sale of GHS ${sale.total.toFixed(2)} via ${sale.paymentMethod}`);
      actions.toast('Sale recorded successfully!', 'success');
      return record;
    },

    addCredit: (data) => {
      const credit = {
        id: generateId(),
        ...data,
        amountPaid: 0,
        balance: data.totalAmount,
        payments: [],
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CREDIT', payload: credit });
      actions.logActivity('CREDIT_ADDED', `Credit for ${data.customerName}: GHS ${data.totalAmount}`);
      actions.toast('Credit entry recorded!', 'success');
      return credit;
    },
    recordPayment: (creditId, payment, credit) => {
      const newPaid = credit.amountPaid + payment.amount;
      const newBalance = credit.totalAmount - newPaid;
      const updated = {
        id: creditId,
        amountPaid: newPaid,
        balance: newBalance,
        payments: [...(credit.payments || []), { ...payment, date: new Date().toISOString() }],
        status: newBalance <= 0 ? 'paid' : 'partial',
      };
      dispatch({ type: 'UPDATE_CREDIT', payload: updated });
      actions.logActivity('PAYMENT', `Payment of GHS ${payment.amount} from ${credit.customerName}`);
      actions.toast('Payment recorded!', 'success');
    },
    deleteCredit: (id) => {
      dispatch({ type: 'DELETE_CREDIT', payload: id });
      actions.toast('Credit entry deleted.', 'info');
    },

    addSupplier: (data) => {
      const supplier = { id: generateId(), ...data, createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
      actions.logActivity('SUPPLIER_ADDED', `Added supplier: ${data.name}`);
      actions.toast('Supplier added!', 'success');
    },
    updateSupplier: (id, data) => {
      dispatch({ type: 'UPDATE_SUPPLIER', payload: { id, ...data } });
      actions.toast('Supplier updated!', 'success');
    },
    deleteSupplier: (id) => {
      dispatch({ type: 'DELETE_SUPPLIER', payload: id });
      actions.toast('Supplier removed.', 'info');
    },

    addCustomer: (data) => {
      const customer = { id: generateId(), ...data, createdAt: new Date().toISOString() };
      dispatch({ type: 'ADD_CUSTOMER', payload: customer });
      actions.logActivity('CUSTOMER_ADDED', `Added customer: ${data.name}`);
      actions.toast('Customer added!', 'success');
    },
    updateCustomer: (id, data) => {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: { id, ...data } });
      actions.toast('Customer updated!', 'success');
    },
    deleteCustomer: (id) => {
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
      actions.toast('Customer removed.', 'info');
    },

    logActivity: (action, details) => {
      dispatch({ type: 'LOG_ACTIVITY', payload: { action, details, user: state.auth.username || 'System' } });
    },

    toast: (message, type = 'info') => {
      dispatch({ type: 'SHOW_TOAST', payload: { message, type, id: Date.now() } });
      setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3500);
    },
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
      {state.toast && <Toast toast={state.toast} />}
    </AppContext.Provider>
  );
}

function Toast({ toast }) {
  const colors = {
    success: 'border-green-500/40 bg-green-500/10 text-green-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-300',
    info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  };
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <div className="fixed bottom-6 right-4 z-[9999] toast-enter">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-sm ${colors[toast.type] || colors.info}`}>
        <span className="text-lg font-bold">{icons[toast.type]}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
