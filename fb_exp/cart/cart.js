import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAy8ieDrRVrhBk313qLD22nhpQdUZ8Sd-U",
    authDomain: "database-ca75a.firebaseapp.com",
    projectId: "database-ca75a",
    storageBucket: "database-ca75a.firebaseapp.com",
    messagingSenderId: "33502186647",
    appId: "1:33502186647:web:7dea3d193baa8578c96dd2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const cartCollection = collection(db, 'cart');

let cart = [];

const toast = document.getElementById('toast');
const spinner = document.querySelector('.spinner');

async function fetchCart() {
    showSpinner(true);
    try {
        const querySnapshot = await getDocs(cartCollection);
        cart = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    } catch (error) {
        showToast("Error fetching cart: " + error.message);
    } finally {
        showSpinner(false);
    }
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p>Your cart is empty.</p>`;
        cartTotal.textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');

        cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.title}">
                    <div class="item-details">
                        <h3>${item.title}</h3>
                        <p>Price: $${item.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button id="decrease-${item.id}" class="quantity-button decrease">-</button>
                            <span id="quantity-${item.id}">${item.quantity}</span>
                            <button id="increase-${item.id}" class="quantity-button increase">+</button>
                        </div>
                        <p>Total: $${itemTotal.toFixed(2)}</p>
                    </div>
                    <button id="remove-${item.id}" class="remove-button">Remove</button>
                `;

        cartItems.appendChild(cartItem);

        document.getElementById(`increase-${item.id}`).addEventListener('click', () => updateCart(item.id, 1));
        document.getElementById(`decrease-${item.id}`).addEventListener('click', () => updateCart(item.id, -1));
        document.getElementById(`remove-${item.id}`).addEventListener('click', () => removeItem(item.id));
    });

    cartTotal.textContent = total.toFixed(2);
}

async function updateCart(itemId, change) {
    showSpinner(true);
    try {
        const product = cart.find(item => item.id === itemId);
        if (!product) return;

        product.quantity = Math.max(1, product.quantity + change);

        await updateDoc(doc(db, 'cart', itemId), { quantity: product.quantity });

        localStorage.setItem('cart', JSON.stringify(cart));
        showToast("Item updated successfully.");
        fetchCart();
    } catch (error) {
        showToast("Error updating item: " + error.message);
    } finally {
        showSpinner(false);
    }
}

async function removeItem(itemId) {
    showSpinner(true);
    try {
        await deleteDoc(doc(db, 'cart', itemId));

        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cart));

        showToast("Item removed successfully.");
        fetchCart();
    } catch (error) {
        showToast("Error removing item: " + error.message);
    } finally {
        showSpinner(false);
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showSpinner(visible) {
    spinner.style.display = visible ? 'flex' : 'none';
}

fetchCart();