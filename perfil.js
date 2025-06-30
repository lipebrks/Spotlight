let originalData = {};
let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();

    document.getElementById("editButton").addEventListener("click", enableEdit);
    document.getElementById("saveButton").addEventListener("click", saveChanges);
    document.getElementById("cancelButton").addEventListener("click", cancelEdit);
    document.getElementById("uploadPhoto").addEventListener("change", handlePhotoUpload);

    document.getElementById("isProdutor").addEventListener("change", toggleRole);
    document.getElementById("isArtista").addEventListener("change", toggleRole);
});

async function loadUserProfile() {
    const usuarioLogadoStr = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogadoStr) {
        alert('Nenhum usuário logado. Redirecionando para o login.');
        window.location.href = 'login.html';
        return;
    }

    let usuarioLogado;
    try {
        usuarioLogado = JSON.parse(usuarioLogadoStr);
        currentUserId = usuarioLogado.id;
        if (!currentUserId && usuarioLogado.login) {

            const response = await fetch(`https://spotlight-backend-z6xo.onrender.com/usuarios?login=${usuarioLogado.login}`);
            const users = await response.json();
            if (users.length > 0) {
                currentUserId = users[0].id;
            } else {
                throw new Error('Usuário logado não encontrado no banco de dados.');
            }
        }
    } catch (e) {
        console.error("Erro ao parsear usuarioLogado do sessionStorage ou obter ID:", e);
        alert('Erro ao carregar dados do usuário. Faça login novamente.');
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
        return;
    }

    if (!currentUserId) {
        alert('ID do usuário não encontrado. Faça login novamente.');
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`https://spotlight-backend-z6xo.onrender.com/usuarios/${currentUserId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do perfil. Status: ' + response.status);
        }
        const userData = await response.json();


        document.getElementById("nomeDisplay").textContent = userData.nome || 'Não informado';
        document.getElementById("emailDisplay").textContent = userData.email || 'Não informado';
        document.getElementById("loginDisplay").textContent = userData.login || 'Não informado';
        document.getElementById("bioDisplay").textContent = userData.biografia || 'Adicione uma biografia...';
        document.getElementById("profileImage").src = userData.foto || 'avatar-15.png';

        document.getElementById("isProdutor").checked = userData.produtor;
        document.getElementById("isArtista").checked = userData.artista;

        const tagList = document.getElementById("tagList");
        tagList.innerHTML = "";
        if (userData.tags && Array.isArray(userData.tags)) {
            userData.tags.forEach(tag => {
                tagList.appendChild(createTagElement(tag));
            });
        }

        originalData = { ...userData, tags: getCurrentTags() };

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        alert(`Erro ao carregar perfil: ${error.message}.`);
       
    }
}

function enableEdit() {
    
    document.getElementById("nomeDisplay").classList.add("hidden");
    document.getElementById("emailDisplay").classList.add("hidden");
    document.getElementById("bioDisplay").classList.add("hidden");
    document.getElementById("senhaDisplay").classList.add("hidden");


    document.getElementById("nomeInput").classList.remove("hidden");
    document.getElementById("emailInput").classList.remove("hidden");
    
    document.getElementById("bioInput").classList.remove("hidden");
    document.getElementById("senhaInput").classList.remove("hidden");

   
    document.getElementById("nomeInput").value = document.getElementById("nomeDisplay").textContent;
    document.getElementById("emailInput").value = document.getElementById("emailDisplay").textContent;
    document.getElementById("loginInput").value = document.getElementById("loginDisplay").textContent;
    document.getElementById("bioInput").value = document.getElementById("bioDisplay").textContent === 'Adicione uma biografia...' ? '' : document.getElementById("bioDisplay").textContent;
    document.getElementById("senhaInput").value = ''; 

    
    document.querySelector(".edit-photo-label").classList.remove("hidden");
    document.getElementById("isProdutor").disabled = false;
    document.getElementById("isArtista").disabled = false;


    document.getElementById("editButton").classList.add("hidden");
    document.getElementById("saveButton").classList.remove("hidden");
    document.getElementById("cancelButton").classList.remove("hidden");
    document.getElementById("addTagContainer").classList.remove("hidden");

   
    originalData = {
        nome: document.getElementById("nomeDisplay").textContent,
        email: document.getElementById("emailDisplay").textContent,
        login: document.getElementById("loginDisplay").textContent,
        biografia: document.getElementById("bioDisplay").textContent === 'Adicione uma biografia...' ? '' : document.getElementById("bioDisplay").textContent,
        foto: document.getElementById("profileImage").src,
        produtor: document.getElementById("isProdutor").checked,
        artista: document.getElementById("isArtista").checked,
        tags: getCurrentTags()
    };
}

async function saveChanges() {
    const newNome = document.getElementById("nomeInput").value;
    const newEmail = document.getElementById("emailInput").value;
    const newLogin = document.getElementById("loginDisplay").textContent;
    const newSenha = document.getElementById("senhaInput").value; 
    const newBio = document.getElementById("bioInput").value;
    const newFoto = document.getElementById("profileImage").src;
    const newIsProdutor = document.getElementById("isProdutor").checked;
    const newIsArtista = document.getElementById("isArtista").checked;
    const newTags = getCurrentTags();

    if (newIsProdutor && newIsArtista) {
        alert('Não é possível ser Produtor e Artista ao mesmo tempo!');
        return;
    }

    const updatedUserData = {
        nome: newNome,
        email: newEmail,
        login: newLogin, 
        biografia: newBio,
        foto: newFoto,
        produtor: newIsProdutor,
        artista: newIsArtista,
        tags: newTags 
    };

   
    if (newSenha) {
        updatedUserData.senha = newSenha; 
    } else {
        
        const response = await fetch(`https://spotlight-backend-z6xo.onrender.com/usuarios/${currentUserId}`);
        const existingUser = await response.json();
        if (existingUser && existingUser.senha) {
            updatedUserData.senha = existingUser.senha;
        }
    }

    try {
        const response = await fetch(`https://spotlight-backend-z6xo.onrender.com/usuarios/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUserData)
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar alterações no perfil. Status: ' + response.status);
        }

        const savedUser = await response.json();
        console.log('Perfil atualizado:', savedUser);

        
        sessionStorage.setItem('usuarioLogado', JSON.stringify(savedUser));

        
        document.getElementById("nomeDisplay").textContent = savedUser.nome;
        document.getElementById("emailDisplay").textContent = savedUser.email;
        document.getElementById("loginDisplay").textContent = savedUser.login;
        document.getElementById("bioDisplay").textContent = savedUser.biografia || 'Adicione uma biografia...';
        document.getElementById("profileImage").src = savedUser.foto;
        document.getElementById("isProdutor").checked = savedUser.produtor;
        document.getElementById("isArtista").checked = savedUser.artista;

        const tagList = document.getElementById("tagList");
        tagList.innerHTML = "";
        if (savedUser.tags && Array.isArray(savedUser.tags)) {
            savedUser.tags.forEach(tag => {
                tagList.appendChild(createTagElement(tag));
            });
        }

        endEditMode();
        alert('Perfil salvo com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert(`Erro ao salvar perfil: ${error.message}`);
    }
}

function cancelEdit() {
   
    document.getElementById("nomeDisplay").textContent = originalData.nome;
    document.getElementById("emailDisplay").textContent = originalData.email;
    document.getElementById("loginDisplay").textContent = originalData.login;
    document.getElementById("bioDisplay").textContent = originalData.biografia || 'Adicione uma biografia...';
    document.getElementById("profileImage").src = originalData.foto;
    document.getElementById("isProdutor").checked = originalData.produtor;
    document.getElementById("isArtista").checked = originalData.artista;

    const tagList = document.getElementById("tagList");
    tagList.innerHTML = "";
    if (originalData.tags && Array.isArray(originalData.tags)) {
        originalData.tags.forEach(tag => {
            tagList.appendChild(createTagElement(tag));
        });
    }

    endEditMode();
}

function endEditMode() {
    
    document.getElementById("nomeDisplay").classList.remove("hidden");
    document.getElementById("emailDisplay").classList.remove("hidden");
    document.getElementById("loginDisplay").classList.remove("hidden");
    document.getElementById("bioDisplay").classList.remove("hidden");
    document.getElementById("senhaDisplay").classList.remove("hidden");


    document.getElementById("nomeInput").classList.add("hidden");
    document.getElementById("emailInput").classList.add("hidden");
    document.getElementById("loginInput").classList.add("hidden");
    document.getElementById("bioInput").classList.add("hidden");
    document.getElementById("senhaInput").classList.add("hidden");


   
    document.querySelector(".edit-photo-label").classList.add("hidden");
    document.getElementById("isProdutor").disabled = true;
    document.getElementById("isArtista").disabled = true;

    document.getElementById("editButton").classList.remove("hidden");
    document.getElementById("saveButton").classList.add("hidden");
    document.getElementById("cancelButton").classList.add("hidden");
    document.getElementById("addTagContainer").classList.add("hidden");
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("profileImage").src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function createTagElement(tagText) {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = tagText;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-tag";
    removeBtn.textContent = "×";
    removeBtn.title = "Remover tag";
    removeBtn.onclick = () => {
        tag.classList.add("fadeOut");
        setTimeout(() => {
            tag.remove();
        }, 300);
    };

    tag.appendChild(removeBtn);
    return tag;
}

function addTag() {
    const select = document.getElementById("newTagSelect");
    const tagValue = select.value;

    if (!tagValue) return;

    const existingTags = getCurrentTags();
    if (existingTags.includes(tagValue)) {
        alert("Tag já adicionada.");
        return;
    }

    const tagList = document.getElementById("tagList");
    const newTag = createTagElement(tagValue);
    tagList.appendChild(newTag);

    select.value = "";
}

function getCurrentTags() {
    const tags = [];
    document.querySelectorAll("#tagList .tag").forEach(tagEl => {
        tags.push(tagEl.firstChild.nodeValue.trim());
    });
    return tags;
}


function toggleRole(event) {
    const isProdutorCheckbox = document.getElementById('isProdutor');
    const isArtistaCheckbox = document.getElementById('isArtista');

    if (event.target.id === 'isProdutor' && isProdutorCheckbox.checked) {
        isArtistaCheckbox.checked = false;
    } else if (event.target.id === 'isArtista' && isArtistaCheckbox.checked) {
        isProdutorCheckbox.checked = false;
    }
}