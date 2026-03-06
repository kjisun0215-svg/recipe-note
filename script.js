let recipes = JSON.parse(localStorage.getItem("recipes")) || []
let editIndex=null

function saveRecipe(){

let title=titleInput.value
let content=contentInput.value
let category=category.value
let tags=tagsInput.value.split(",")
let time=timeInput.value
let level=levelSelect.value
let steps=stepsInput.value.split("\n")

let file=image.files[0]

if(!title) return

if(file){

let reader=new FileReader()

reader.onload=function(e){

storeRecipe(e.target.result)

}

reader.readAsDataURL(file)

}else{

storeRecipe(null)

}

function storeRecipe(img){

let recipe={
title,
content,
category,
tags,
time,
level,
steps,
image:img,
favorite:false
}

if(editIndex!==null){

recipes[editIndex]=recipe
editIndex=null

}else{

recipes.push(recipe)

}

localStorage.setItem("recipes",JSON.stringify(recipes))

render()
clearForm()

}

}

function render(){

let list=document.getElementById("recipeList")
let fav=document.getElementById("favoriteList")
let search=document.getElementById("search").value

list.innerHTML=""
fav.innerHTML=""

recipes
.filter(r=>r.title.includes(search))
.forEach((r,i)=>{

let div=document.createElement("div")
div.className="recipe"

div.innerHTML=`
<h3>${r.title}</h3>
<p>${r.category} | ${r.time} | 난이도:${r.level}</p>
<p>${r.content}</p>

<ol>
${r.steps.map(s=>`<li>${s}</li>`).join("")}
</ol>

${r.image ? `<img src="${r.image}">`:""}

<button onclick="editRecipe(${i})">수정</button>
<button onclick="deleteRecipe(${i})">삭제</button>
<button onclick="toggleFavorite(${i})">
${r.favorite ? "★":"☆"}
</button>
`

if(r.favorite){

div.classList.add("favorite")
fav.appendChild(div)

}else{

list.appendChild(div)

}

})

}

function deleteRecipe(i){

recipes.splice(i,1)

localStorage.setItem("recipes",JSON.stringify(recipes))

render()

}

function toggleFavorite(i){

recipes[i].favorite=!recipes[i].favorite

localStorage.setItem("recipes",JSON.stringify(recipes))

render()

}

function editRecipe(i){

let r=recipes[i]

titleInput.value=r.title
contentInput.value=r.content
tagsInput.value=r.tags.join(",")
timeInput.value=r.time
stepsInput.value=r.steps.join("\n")

editIndex=i

}

function clearForm(){

titleInput.value=""
contentInput.value=""
tagsInput.value=""
timeInput.value=""
stepsInput.value=""

}

document.getElementById("search").addEventListener("input",render)

render()
