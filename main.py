from fastapi import FastAPI, Request, Body, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId
import json

app = FastAPI()

# --- CONFIGURATION & DATABASE SETUP ---
# Replace with your Atlas URI if you aren't running MongoDB locally
MONGO_URL = "mongodb://localhost:27017/recipe_database"
client = AsyncIOMotorClient(MONGO_URL)
db = client.recipe_database
recipe_collection = db.get_collection("recipes")
user_collection = db.get_collection("users")

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- MODELS ---
class Recipe(BaseModel):
    name: str
    ingredients: str
    instructions: str

class User(BaseModel):
    username: str
    password: str

# --- STARTUP DATA MIGRATION ---
@app.on_event("startup")
async def migrate_data():
    # If MongoDB is empty, pull data from your old recipes.json
    count = await recipe_collection.count_documents({})
    if count == 0:
        try:
            with open("recipes.json", "r") as f:
                data = json.load(f)
                if data:
                    await recipe_collection.insert_many(data)
                    print("Successfully migrated recipes.json to MongoDB")
        except FileNotFoundError:
            pass

@app.on_event("startup")
async def test_connection():
    try:
        # The 'ping' command is cheap and checks if the server is there
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# --- AUTHENTICATION ROUTES ---
@app.post("/register")
async def register(user: User):
    existing_user = await user_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = pwd_context.hash(user.password)
    await user_collection.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(user: User):
    db_user = await user_collection.find_one({"username": user.username})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "username": user.username}

# --- RECIPE ROUTES (Now using MongoDB) ---
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/recipes")
async def get_recipes():
    recipes = []
    async for recipe in recipe_collection.find():
        # Convert MongoDB ObjectId to string so JSON can handle it
        recipe["_id"] = str(recipe["_id"])
        recipes.append(recipe)
    return recipes

@app.post("/recipes")
async def add_recipe(recipe: Recipe):
    await recipe_collection.insert_one(recipe.dict())
    return {"message": "Recipe added to MongoDB"}

@app.delete("/recipes/{id}")
async def delete_recipe(id: str):
    await recipe_collection.delete_one({"_id": ObjectId(id)})
    return {"message": "Recipe deleted"}

@app.put("/recipes/{id}")
async def edit_recipe(id: str, recipe: Recipe):
    await recipe_collection.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": recipe.dict()}
    )
    return {"message": "Recipe updated"}
