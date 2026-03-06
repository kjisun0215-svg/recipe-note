let recipes = JSON.parse(localStorage.getItem("recipes")) || []

function saveRecipe(){

const recipe = {

title: document.getElementById("title").value,
category: document.getElementById("category").value,
tags: document.getElementById("tags").value,
time: document.getElementById("time").value,
level: document.getElementById("level").value,
steps: document.getElementById("steps").value,
content: document.getElementById("content").value

}

recipes.push(recipe)

localStorage.setItem("recipes", JSON.stringify(recipes))

renderRecipes()

}

function renderRecipes(){

const list = document.getElementById("recipeList")

list.innerHTML = ""

recipes.forEach((r,i)=>{

const div = document.createElement("div")
div.className="recipe"

div.innerHTML = `
<h3>${r.title}</h3>
<p>카테고리: ${r.category}</p>
<p>태그: ${r.tags}</p>
<p>시간: ${r.time}</p>
<p>난이도: ${r.level}</p>
<p>${r.content}</p>
<pre>${r.steps}</pre>
<button onclick="deleteRecipe(${i})">삭제</button>
`

list.appendChild(div)

})

}

function deleteRecipe(i){

recipes.splice(i,1)

localStorage.setItem("recipes", JSON.stringify(recipes))

renderRecipes()

}

function searchRecipe(){

const keyword = document.getElementById("search").value.toLowerCase()

const filtered = recipes.filter(r =>
r.title.toLowerCase().includes(keyword) ||
r.tags.toLowerCase().includes(keyword)
)

const list = document.getElementById("recipeList")

list.innerHTML=""

filtered.forEach(r=>{

const div=document.createElement("div")

div.className="recipe"

div.innerHTML=`
<h3>${r.title}</h3>
<p>${r.content}</p>
`

list.appendChild(div)

})

}

async function extractRecipe(){

const url=document.getElementById("recipeUrl").value

const proxy="https://api.allorigins.win/raw?url="

try{

const page=await fetch(proxy+encodeURIComponent(url))
const html=await page.text()

const ai=await fetch("https://api.openai.com/v1/chat/completions",{

method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer YOUR_OPENAI_KEY"
},

body:JSON.stringify({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:"웹페이지에서 요리 레시피를 찾아 재료, 조리순서, 요약으로 정리해줘."
},
{
role:"user",
content:html.substring(0,7000)
}
]

})

})

const data=await ai.json()

document.getElementById("urlResult").innerText =
data.choices[0].message.content

}catch(e){

document.getElementById("urlResult").innerText =
"레시피를 가져오지 못했습니다."

}

}

renderRecipes()

document.getElementById("search").addEventListener("input",render)

render()
