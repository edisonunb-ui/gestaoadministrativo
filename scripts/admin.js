const createUserButton = document.getElementById('createUserButton');
const createCondoButton = document.getElementById('createCondoButton');
const userList = document.getElementById('userList');
const condoList = document.getElementById('condoList');

// --- ELEMENTOS DA JANELA MODAL ---
const assignModal = document.getElementById('assignModal');
const modalTitle = document.getElementById('modalTitle');
const modalUserList = document.getElementById('modalUserList');
const closeButton = document.querySelector('.close-button');

// --- ELEMENTOS DE UPLOAD ---
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const uploadProgress = document.getElementById('uploadProgress');
const condoForUpload = document.getElementById('condoForUpload');


// --- LÓGICA DE UPLOAD ORGANIZADO ---
if (uploadButton) {
    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        const selectedCondoId = condoForUpload.value;

        if (!file) {
            alert('Por favor, selecione um arquivo.');
            return;
        }
        if (!selectedCondoId) {
            alert('Por favor, selecione um condomínio.');
            return;
        }

        // Caminho organizado no Storage: /condominios/{condoId}/nome_do_arquivo
        const storagePath = `condominios/${selectedCondoId}/${file.name}`;
        const storageRef = storage.ref(storagePath);

        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.value = progress;
                uploadProgress.style.display = 'block';
            },
            (error) => {
                console.error("Erro no upload: ", error);
                alert("Ocorreu um erro ao enviar o arquivo.");
                uploadProgress.style.display = 'none';
            },
            () => {
                // Upload concluído com sucesso
                uploadProgress.style.display = 'none';
                fileInput.value = ''; // Limpa o campo

                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('Arquivo disponível em', downloadURL);
                    
                    // Salva a "ficha" do documento no Firestore
                    db.collection('documentos').add({
                        condominioId: selectedCondoId,
                        nomeArquivo: file.name,
                        url: downloadURL,
                        path: storagePath, // Salva o caminho para futuras operações (ex: deletar)
                        dataUpload: new Date()
                    }).then(() => {
                        alert('Arquivo enviado e registrado com sucesso!');
                    }).catch(err => {
                        console.error("Erro ao salvar registro do documento: ", err);
                        alert("Arquivo enviado, mas falha ao registrar no banco de dados.");
                    });
                });
            }
        );
    });
}

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
                userItem.innerHTML = `${user.name} <small>(${user.email})</small>`;
                userItem.classList.add('modal-user-item');
                userItem.onclick = () => assignUserToCondo(condoId, userId, user.name, roleToAssign);
                modalUserList.appendChild(userItem);
            });
        }
    } catch (error) {
        console.error(`Erro ao buscar usuários (${roleToAssign}): `, error);
        modalUserList.innerHTML = `<li>Erro ao carregar usuários.</li>`;
    }
}

async function assignUserToCondo(condoId, userId, userName, role) {
    const condoRef = db.collection('condominios').doc(condoId);
    const updateData = {};
    updateData[`${role}Id`] = userId;
    updateData[`${role}Name`] = userName;

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

// --- CARREGAMENTO DE DADOS ---

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

// --- FUNÇÃO PARA CARREGAR CONDOMÍNIOS NO SELETOR DE UPLOAD ---
function loadCondosForUpload() {
    if (!condoForUpload) return;

    db.collection('condominios').orderBy('name').get().then(querySnapshot => {
        condoForUpload.innerHTML = '<option value="">-- Selecione um condomínio --</option>';
        if (querySnapshot.empty) {
            condoForUpload.innerHTML = '<option value="">-- Nenhum condomínio cadastrado --</option>';
        }
        querySnapshot.forEach(doc => {
            const condo = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // O valor da opção é o ID do documento
            option.textContent = condo.name;
            condoForUpload.appendChild(option);
        });
    }).catch(error => {
        console.error("Erro ao carregar condomínios para upload: ", error);
        condoForUpload.innerHTML = '<option value="">-- Erro ao carregar --</option>';
    });
}


// --- INICIALIZAÇÃO QUANDO A PÁGINA CARREGA ---

window.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadCondos();
    loadCondosForUpload(); // <-- Chamar a nova função aqui
});

// --- AÇÕES DOS BOTÕES (CRIAR USUÁRIO E CONDOMÍNIO) ---

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
                loadCondosForUpload(); // Recarrega o seletor de upload também
            })
            .catch(error => console.error("Erro ao criar condomínio: ", error));
    });
}
