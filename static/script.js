const API = "/recipes";

let editingId = null; 
let currentRecipes = [];

// --- LOGIN & REGISTRATION LOGIC ---
async function handleRegister() {
    const username = prompt("Enter a new username:");
    const password = prompt("Enter a new password:");

    if (!username || !password) return alert("Username and password required");

    const user = { username, password };

    try {
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        const data = await res.json();
        alert(data.detail || data.message);
    } catch (err) {
        console.error("Register Error:", err);
        alert("Server error. Check your Python terminal!");
    }
}

async function handleLogin() {
    const username = prompt("Username:");
    const password = prompt("Password:"); // Fixed the double assignment typo here

    if (!username || !password) return;

    const user = { username, password };

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        const data = await res.json();

        if (res.ok) {
            alert(`Welcome, ${data.username}!`);
            const greeting = document.getElementById("userGreeting");
            if (greeting) greeting.innerText = `Logged in as: ${data.username} | `;
            
            // OPTIONAL: Show the form only after login
            document.querySelector(".form").style.opacity = "1";
        } else {
            alert(data.detail || "Login failed");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Invalid response from server. Make sure MongoDB is running.");
    }
}

// --- RECIPE LOGIC ---
async function loadRecipes() {
    const res = await fetch(API);
    const recipes = await res.json();
    currentRecipes = recipes;

    const grid = document.getElementById("recipeGrid");
    grid.innerHTML = "";

    recipes.forEach((recipe) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>${recipe.name}</h3>
            <p><b>Ingredients:</b><br>${recipe.ingredients}</p>
            <p><b>Instructions:</b><br>${recipe.instructions}</p>
            <div class="buttons">
                <button class="edit" onclick="openEdit('${recipe._id}')">Edit</button>
                <button class="delete" onclick="deleteRecipe('${recipe._id}')">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function addRecipe() {
    const recipe = {
        name: document.getElementById("name").value,
        ingredients: document.getElementById("ingredients").value,
        instructions: document.getElementById("instructions").value
    };

    if (!recipe.name) return alert("Please enter a recipe name");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe)
    });

    document.getElementById("name").value = "";
    document.getElementById("ingredients").value = "";
    document.getElementById("instructions").value = "";

    loadRecipes();
}

async function deleteRecipe(id) {
    if (confirm("Are you sure you want to delete this recipe?")) {
        await fetch(`${API}/${id}`, { method: "DELETE" });
        loadRecipes();
    }
}

function openEdit(id) {
    editingId = id;
    const recipe = currentRecipes.find(r => r._id === id);

    document.getElementById("editName").value = recipe.name;
    document.getElementById("editIngredients").value = recipe.ingredients;
    document.getElementById("editInstructions").value = recipe.instructions;

    document.getElementById("editModal").style.display = "block";
}

async function saveEdit() {
    const recipe = {
        name: document.getElementById("editName").value,
        ingredients: document.getElementById("editIngredients").value,
        instructions: document.getElementById("editInstructions").value
    };

    await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe)
    });

    closeModal();
    loadRecipes();
}

function closeModal() {
    document.getElementById("editModal").style.display = "none";
}

loadRecipes();
