import { initScene, addOrUpdateModel, removeModel, updateModelTransformFromScene } from './scene.js';
import { setupUI, updateUserList, showLoader, hideLoader, setupDownloadButton } from './ui.js';

async function main() {
    const canvas = document.querySelector('#c');
    const sceneObjects = initScene(canvas, onTransformEnd, onSelectionChange);

    const room = new WebsimSocket();
    await room.initialize();

    // The user list needs the peers object, so we pass it during UI setup
    setupUI(handleModelUpload);
    setupDownloadButton();

    // Initial user list render
    updateUserList(room.peers);

    function onTransformEnd(modelId) {
        const modelData = updateModelTransformFromScene(modelId);
        if (modelData) {
            room.updateRoomState({
                models: {
                    [modelId]: modelData,
                }
            });
        }
    }

    function onSelectionChange(modelUrl) {
        setupDownloadButton(modelUrl);
    }

    async function handleModelUpload(file) {
        showLoader();
        try {
            const url = await window.websim.upload(file);
            const modelId = `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            room.updateRoomState({
                models: {
                    [modelId]: {
                        id: modelId,
                        url,
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 },
                        owner: room.clientId,
                    }
                }
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload model.');
        } finally {
            hideLoader();
        }
    }

    room.subscribeRoomState((roomState) => {
        const serverModels = roomState.models || {};
        const clientModelIds = Object.keys(sceneObjects.models);
        const serverModelIds = Object.keys(serverModels);

        // Add or update models
        for (const modelId of serverModelIds) {
            const modelData = serverModels[modelId];
            if (modelData) { // Check if model data is not null
                 addOrUpdateModel(modelData);
            }
        }

        // Remove models that are no longer in the room state
        for (const modelId of clientModelIds) {
            if (!serverModels[modelId]) {
                removeModel(modelId);
            }
        }
    });

    room.subscribePresence((presence) => {
        updateUserList(room.peers);
    });
}

main();