const createUserButton = document.getElementById('createUserButton');
const createCondoButton = document.getElementById('createCondoButton');
const userList = document.getElementById('userList');
const condoList = document.getElementById('condoList');

// --- ELEMENTOS DA JANELA MODAL ---
const assignModal = document.getElementById('assignModal');
const modalTitle = document.getElementById('modalTitle');
const modalUserList = document.getElementById('modalUserList');
const closeButton = document.querySelector('.close-button');

// --- LÓGICA DE DESIGNAÇÃO ---

function closeModal() {
    if (assignModal) assignModal.style.display = 'none';
}
if (closeButton) closeButton.onclick = closeModal;
window.onclick = function(event) {
    if (event.target == assignModal) {
        closeModal();
    }
}

async function showAssignModal(condoId, condoName, roleToAssign) {
    if (!assignModal || !modalTitle || !modalUserList) return;
    
    modalTitle.textContent = `Designar ${roleToAssign} para ${condoName}`;
    modalUserList.innerHTML = '<li>Carregando...</li>';
    assignModal.style.display = 'block';

    try {
        const usersSnapshot = await db.collection('usuarios').where('role', '==', roleToAssign).get();
        modalUserList.innerHTML = '';

        if (usersSnapshot.empty) {
            modalUserList.innerHTML = `<li>Nenhum usuário com a função de ${roleToAssign} encontrado.</li>`;
        } else {
            usersSnapshot.forEach(userDoc => {
                const user = userDoc.data();
                const userId = userDoc.id;
                const userItem = document.createElement('li');
                userItem.innerHTML = `${user.name} <small>(${user.email})</small>`; // Mostra Nome e Email
                userItem.classList.add('modal-user-item');
                userItem.onclick = () => assignUserToCondo(condoId, userId, user.name, roleToAssign); // Passa o NOME para a designação
                modalUserList.appendChild(userItem);
            });
        }
    } catch (error) {
        console.error(`Erro ao buscar usuários (${roleToAssign}): `, error);
        modalUserList.innerHTML = `<li>Erro ao carregar usuários.</li>`;
    }
}

async function assignUserToCondo(condoId, userId, userName, role) { // Agora recebe userName
    const condoRef = db.collection('condominios').doc(condoId);
    const updateData = {};
    updateData[`${role}Id`] = userId;
    updateData[`${role}Name`] = userName; // Salva o NOME no condomínio

    try {
        await condoRef.update(updateData);
        alert(`Usuário ${userName} designado como ${role} com sucesso!`);
        closeModal();
        loadCondos();
    } catch (error) {
        console.error("Erro ao designar usuário: ", error);
        alert("Ocorreu um erro ao salvar a designação.");
    }
}

// --- CARREGAMENTO DE DADOS (COM NOME E EMAIL) ---

function loadUsers() {
    if (!userList) return;
    db.collection('usuarios').orderBy('name').get().then(querySnapshot => {
        userList.innerHTML = '';
        querySnapshot.forEach(doc => {
            const user = doc.data();
            const listItem = document.createElement('li');
            listItem.classList.add('user-item');

            const userInfo = document.createElement('span');
            userInfo.innerHTML = `${user.name || '<i>Nome não definido</i>'} <small>(${user.email})</small>`;

            const roleSpan = document.createElement('span');
            roleSpan.textContent = user.role;
            roleSpan.classList.add('role');
            
            listItem.appendChild(userInfo);
            listItem.appendChild(roleSpan);
            userList.appendChild(listItem);
        });
    }).catch(error => console.error("Erro ao carregar usuários: ", error));
}

function loadCondos() {
    if (!condoList) return;
    db.collection('condominios').orderBy('name').get().then(querySnapshot => {
        condoList.innerHTML = '';
        querySnapshot.forEach(doc => {
            const condo = doc.data();
            const condoId = doc.id;

            const listItem = document.createElement('li');
            listItem.classList.add('condo-item');

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('info');
            infoDiv.innerHTML = `
                <strong>${condo.name}</strong>
                <small>Síndico: ${condo.sindicoName || '<i>Não designado</i>'}</small>
                <small>Admin: ${condo.adminName || '<i>Não designada</i>'}</small>
            `;

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');

            const assignSindicoBtn = document.createElement('button');
            assignSindicoBtn.textContent = condo.sindicoId ? 'Alterar Síndico' : 'Designar Síndico';
            assignSindicoBtn.onclick = () => showAssignModal(condoId, condo.name, 'sindico');

            const assignAdminBtn = document.createElement('button');
            assignAdminBtn.textContent = condo.adminId ? 'Alterar Admin' : 'Designar Admin';
            assignAdminBtn.onclick = () => showAssignModal(condoId, condo.name, 'admin');

            actionsDiv.appendChild(assignSindicoBtn);
            actionsDiv.appendChild(assignAdminBtn);

            listItem.appendChild(infoDiv);
            listItem.appendChild(actionsDiv);
            condoList.appendChild(listItem);
        });
    }).catch(error => console.error("Erro ao carregar condomínios: ", error));
}

window.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadCondos();
});

// --- AÇÕES DOS BOTÕES (COM CAMPO NOME) ---

if (createUserButton) {
    createUserButton.addEventListener('click', () => {
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;

        if (!name || !email || !password) return alert('Por favor, preencha todos os campos: Nome, E-mail e Senha.');

        const userData = { name: name, role: role, email: email };

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => db.collection('usuarios').doc(userCredential.user.uid).set(userData))
            .then(() => {
                alert(`Usuário ${name} (${role}) foi criado com sucesso!`);
                document.getElementById('userName').value = '';
                document.getElementById('userEmail').value = '';
                document.getElementById('userPassword').value = '';
                loadUsers();
            })
            .catch(error => {
                console.error('Erro ao criar usuário:', error);
                alert(error.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : 'Ocorreu um erro ao criar o usuário.');
            });
    });
}

if (createCondoButton) {
    createCondoButton.addEventListener('click', () => {
        const condoName = document.getElementById('condoName').value;
        if (!condoName) return alert('Por favor, digite o nome do condomínio.');

        db.collection('condominios').add({ name: condoName })
            .then(() => {
                alert(`Condomínio "${condoName}" criado com sucesso!`);
                document.getElementById('condoName').value = '';
                loadCondos();
            })
            .catch(error => console.error("Erro ao criar condomínio: ", error));
    });
}
