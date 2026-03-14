const API = "/recipes"

let editingIndex = null
let currentRecipes = []

async function loadRecipes(){

    const res = await fetch(API)
    const recipes = await res.json()

    currentRecipes = recipes

    const grid = document.getElementById("recipeGrid")
    grid.innerHTML = ""

    recipes.forEach((recipe, index) => {

        const card = document.createElement("div")
        card.className = "card"

        card.innerHTML = `
            <h3>${recipe.name}</h3>
            <p><b>Ingredients:</b><br>${recipe.ingredients}</p>
            <p><b>Instructions:</b><br>${recipe.instructions}</p>

            <div class="buttons">
                <button class="edit" onclick="openEdit(${index})">Edit</button>
                <button class="delete" onclick="deleteRecipe(${index})">Delete</button>
            </div>
        `

        grid.appendChild(card)
    })
}


async function addRecipe(){

    const recipe = {
        name: document.getElementById("name").value,
        ingredients: document.getElementById("ingredients").value,
        instructions: document.getElementById("instructions").value
    }

    await fetch(API,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(recipe)
    })

    document.getElementById("name").value = ""
    document.getElementById("ingredients").value = ""
    document.getElementById("instructions").value = ""

    loadRecipes()
}


async function deleteRecipe(index){

    await fetch(`${API}/${index}`,{
        method:"DELETE"
    })

    loadRecipes()
}


function openEdit(index){

    editingIndex = index

    const recipe = currentRecipes[index]

    document.getElementById("editName").value = recipe.name
    document.getElementById("editIngredients").value = recipe.ingredients
    document.getElementById("editInstructions").value = recipe.instructions

    document.getElementById("editModal").style.display = "block"
}


function closeModal(){
    document.getElementById("editModal").style.display = "none"
}


async function saveEdit(){

    const original = currentRecipes[editingIndex]

    const recipe = {
        name: document.getElementById("editName").value || original.name,
        ingredients: document.getElementById("editIngredients").value || original.ingredients,
        instructions: document.getElementById("editInstructions").value || original.instructions
    }

    await fetch(`${API}/${editingIndex}`,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(recipe)
    })

    closeModal()
    loadRecipes()
}


loadRecipes()