import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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

let cart = JSON.parse(localStorage.getItem('cart')) || []; // Retrieve cart from localStorage or set to empty array

async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        document.getElementById('products-container').innerHTML =
            `<div style="color: red; text-align: center;">Error loading products: ${error.message}</div>`;
    }
}

function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        productCard.innerHTML = `
    <img src="${product.image}" alt="${product.title}" class="product-image">
    <h3 class="product-title">${product.title}</h3>
    <p class="product-price">$${product.price.toFixed(2)}</p>
    <p class="product-description">${product.description}</p>
    <div class="quantity-controls">
        <button id="decrease-${product.id}" class="quantity-button decrease">-</button>
        <span id="quantity-${product.id}" class="quantity-display">1</span>
        <button id="increase-${product.id}" class="quantity-button increase">+</button>
    </div>
    <button id="add-to-cart-${product.id}" class="add-to-cart">Add to Cart</button>
    `;

        productsContainer.appendChild(productCard);
    });

    products.forEach(product => {
        document.getElementById(`increase-${product.id}`).addEventListener('click', () => updateQuantity(product.id, 1));
        document.getElementById(`decrease-${product.id}`).addEventListener('click', () => updateQuantity(product.id, -1));
        document.getElementById(`add-to-cart-${product.id}`).addEventListener('click', () => addToCart(product.id));
    });
}

function updateQuantity(productId, change) {
    const quantityDisplay = document.getElementById(`quantity-${productId}`);
    let currentQuantity = parseInt(quantityDisplay.textContent, 10);
    currentQuantity = Math.max(1, currentQuantity + change);
    quantityDisplay.textContent = currentQuantity;
}

async function addToCart(productId) {
    const addToCartButton = document.getElementById(`add-to-cart-${productId}`);
    const quantityDisplay = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityDisplay.textContent, 10);

    // Show spinner
    addToCartButton.disabled = true; // Disable the button to prevent multiple clicks
    addToCartButton.innerHTML = '<span class="spinner"></span> Adding...';

    try {
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        if (!response.ok) throw new Error('Failed to add product');
        const product = await response.json();

        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 1) + quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        await addProductToFirestore(product, quantity);

        updateCartIcon();
        showToast(`${product.title} added to cart`);
    } catch (error) {
        alert('Error adding product to cart');
    } finally {
        // Revert button state
        addToCartButton.disabled = false;
        addToCartButton.innerHTML = 'Add to Cart';
    }
}

async function addProductToFirestore(product, quantity) {
    try {
        const docRef = await addDoc(collection(db, "cart"), {
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

function updateCartIcon() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.getElementById('cart-icon').innerHTML = `Cart (${totalItems})`;
}

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

document.getElementById('cart-icon').addEventListener('click', () => {
    window.location.href = '../cart/';
});

window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartIcon();
});