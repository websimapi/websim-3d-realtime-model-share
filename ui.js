let onUploadCallback;
let peersData;

export function setupUI(onUpload, peers) {
    onUploadCallback = onUpload;
    peersData = peers;

    const uploadInput = document.getElementById('upload-input');
    uploadInput.addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && onUploadCallback) {
        onUploadCallback(file);
        // Reset the input so the same file can be uploaded again
        event.target.value = null;
    }
}

export function updateUserList(peers) {
    peersData = peers;
    const userListElement = document.getElementById('user-list');
    if (!userListElement) return;

    userListElement.innerHTML = ''; // Clear existing list

    Object.values(peersData).forEach(peer => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const avatar = document.createElement('img');
        avatar.src = peer.avatarUrl;
        avatar.alt = `${peer.username}'s avatar`;
        
        const username = document.createElement('span');
        username.textContent = peer.username;
        
        userItem.appendChild(avatar);
        userItem.appendChild(username);
        
        userListElement.appendChild(userItem);
    });
}

export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

