from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates
import json

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DATA_FILE = "recipes.json"


class Recipe(BaseModel):
    name: str
    ingredients: str
    instructions: str


def load_recipes():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except:
        return []


def save_recipes(recipes):
    with open(DATA_FILE, "w") as f:
        json.dump(recipes, f)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/recipes")
def get_recipes():
    return load_recipes()


@app.post("/recipes")
def add_recipe(recipe: Recipe):
    recipes = load_recipes()
    recipes.append(recipe.dict())
    save_recipes(recipes)
    return {"message": "Recipe added"}


@app.delete("/recipes/{index}")
def delete_recipe(index: int):
    recipes = load_recipes()
    recipes.pop(index)
    save_recipes(recipes)
    return {"message": "Recipe deleted"}


@app.put("/recipes/{index}")
def edit_recipe(index: int, recipe: Recipe):
    recipes = load_recipes()
    recipes[index] = recipe.dict()
    save_recipes(recipes)
    return {"message": "Recipe updated"}