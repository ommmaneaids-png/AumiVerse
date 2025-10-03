// AumiVerse File Manager - Re-architected for Cloudflare R2 & Workers
class AumiVerse {
    constructor() {
        // IMPORTANT: Replace this with your actual worker URL after deploying it.
        this.WORKER_URL = 'https://aumiverse-api.your-username.workers.dev'; // <-- CHANGE THIS

        this.currentFolder = null;
        this.viewMode = 'grid';
        this.sortBy = 'name';
        this.showOnlyOccupied = false;
        this.occupiedFolders = new Set(); // To track which folders have files

        this.predefinedFolders = [
            { name: 'F1', password: '8yU1o' }, { name: 'F2', password: '3xY5q' }, { name: 'F3', password: 'pL8m2' },
            { name: 'F4', password: '9kF1r' }, { name: 'F5', password: 'd4N6s' }, { name: 'F6', password: 'T5vG7' },
            { name: 'F7', password: '2wE4h' }, { name: 'F8', password: 'j3R9t' }, { name: 'F9', password: '6bM1k' },
            { name: 'F10', password: 'Q8zP4' }, { name: 'F11', password: '1gH5j' }, { name: 'F12', password: 's7K2l' },
            { name: 'F13', password: '4nD9x' }, { name: 'F14', password: 'L3cV8' }, { name: 'F15', password: 'm5W6f' },
            { name: 'F16', password: '7aB9c' }, { name: 'F17', password: 'e2X7i' }, { name: 'F18', password: 'B9aR3' },
            { name: 'F19', password: '5tS4u' }, { name: 'F20', password: 'k6J2h' }, { name: 'F21', password: 'Z4qG7' },
            { name: 'F22', password: 'f3Y8p' }, { name: 'F23', password: '7rT1v' }, { name: 'F24', password: 'H5nD9' },
            { name: 'F25', password: 'w2K6m' }, { name: 'F26', password: '9vL4b' }, { name: 'F27', password: 'C8sF3' },
            { name: 'F28', password: 'i1A5z' }, { name: 'F29', password: '4jM7x' }, { name: 'F30', password: 'P6oQ2' },
            { name: 'F31', password: 'u3V9c' }, { name: 'F32', password: 'X5gH8' }, { name: 'F33', password: '2bN7y' },
            { name: 'F34', password: 'R4kE1' }, { name: 'F35', password: 'l6W3t' }, { name: 'F36', password: 'S9dF5' },
            { name: 'F37', password: 'o7P2q' }, { name: 'F38', password: 'G1hJ4' }, { name: 'F39', password: '3zU6r' },
            { name: 'F40', password: 'D8mK2' }, { name: 'F41', password: 'a5B9s' }, { name: 'F42', password: 'J4vL7' },
            { name: 'F43', password: 'q6T3p' }, { name: 'F44', password: 'F2xY8' }, { name: 'F45', password: 'y7C1n' },
            { name: 'F46', password: 'K5wE9' }, { name: 'F47', password: 't3Z6d' }, { name: 'F48', password: 'M8rS4' },
            { name: 'F49', password: 'h1Q5f' }, { name: 'F50', password: 'V9bN2' }
        ];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAllFoldersStatus(); // Check which folders have files
        this.renderFolders();
    }

    // New method to check all folders for content
    async checkAllFoldersStatus() {
        console.log("Checking folder statuses...");
        const promises = this.predefinedFolders.map(async(folder) => {
            try {
                const response = await fetch(`${this.WORKER_URL}/files?prefix=${folder.name}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const files = await response.json();
                if (files.length > 0) {
                    this.occupiedFolders.add(folder.name);
                }
            } catch (error) {
                console.error(`Failed to fetch status for folder ${folder.name}:`, error);
            }
        });
        await Promise.all(promises);
        console.log("Occupied folders:", this.occupiedFolders);
    }

    // Renders the main folder grid
    renderFolders() {
        const container = document.getElementById('folders-container');
        let displayedFolders = this.predefinedFolders;
        if (this.showOnlyOccupied) {
            displayedFolders = this.predefinedFolders.filter(folder => this.occupiedFolders.has(folder.name));
        }

        container.innerHTML = displayedFolders.map(folder => {
            const hasFiles = this.occupiedFolders.has(folder.name);
            return `
                <div class="folder-card ${hasFiles ? 'occupied' : ''} bg-gradient-to-br from-purple-800/80 to-purple-900/60 border border-purple-500/40 rounded-xl p-6 backdrop-blur-lg opacity-20 hover:opacity-100 transition-all duration-500 cursor-pointer" onclick="aumiverse.openUnlockModal('${folder.name}')">
                    <i class="fas fa-folder text-2xl ${hasFiles ? 'text-yellow-400' : 'text-purple-300'} drop-shadow-lg"></i>
                    <div class="text-sm font-bold text-white mt-4">${folder.name}</div>
                    <p class="text-xs text-gray-400 mt-1">${hasFiles ? 'Occupied' : 'Vacant'}</p>
                </div>
            `;
        }).join('');
    }

    // Renders files inside the folder modal
    async renderFiles() {
        const filesGrid = document.getElementById('folder-files');
        const emptyState = document.getElementById('empty-state');
        if (!this.currentFolder) return;

        try {
            const response = await fetch(`${this.WORKER_URL}/files?prefix=${this.currentFolder}`);
            if (!response.ok) throw new Error('Failed to fetch files');
            const files = await response.json();

            if (files.length === 0) {
                emptyState.style.display = 'block';
                filesGrid.innerHTML = '';
                return;
            }

            emptyState.style.display = 'none';
            filesGrid.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${files.map(file => this.createFileCardHTML(file)).join('')}
                </div>
            `;
        } catch (error) {
            console.error("Error rendering files:", error);
            alert("Could not load files from the cloud.");
        }
    }

    createFileCardHTML(file) {
        const fileName = file.Key.split('/').pop();
        const fileSize = (file.Size / 1024 / 1024).toFixed(2); // Convert bytes to MB
        return `
            <div class="file-card bg-slate-700/50 p-3 rounded-lg">
                <div class="flex items-center gap-3">
                    <i class="fas fa-file text-xl text-gray-300"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-white font-medium truncate">${fileName}</p>
                        <p class="text-xs text-gray-400">${fileSize} MB</p>
                    </div>
                    <button class="w-7 h-7 text-green-400 hover:bg-white/10 rounded" title="Download" onclick="aumiverse.downloadFile('${file.Key}')"><i class="fas fa-download"></i></button>
                    <button class="w-7 h-7 text-red-400 hover:bg-white/10 rounded" title="Delete" onclick="aumiverse.deleteFile('${file.Key}', this)"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }

    // Handles file upload process
    async uploadFile() {
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];
        if (!file || !this.currentFolder) return;

        // R2 has a 5 GB per-file limit on the free tier, 100MB is a safe client-side check
        if (file.size > 100 * 1024 * 1024) {
            alert("File size cannot exceed 100 MB.");
            return;
        }

        const fileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize file name
        const fileKey = `${this.currentFolder}/${Date.now()}_${fileName}`;

        this.showUploadProgress(file.name);

        try {
            // 1. Get a secure upload URL from our worker
            const presignResponse = await fetch(`${this.WORKER_URL}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: fileKey, contentType: file.type }),
            });
            if (!presignResponse.ok) throw new Error('Could not get upload URL');
            const { url } = await presignResponse.json();

            // 2. Upload the file directly to R2 using the URL
            const uploadResponse = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });
            if (!uploadResponse.ok) throw new Error('Upload to R2 failed');

            // 3. Refresh UI
            this.occupiedFolders.add(this.currentFolder); // Mark folder as occupied
            await this.renderFiles();
            this.renderFolders(); // Update main grid to show 'occupied' status

        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            this.hideUploadProgress();
            fileInput.value = ''; // Reset input
        }
    }

    // Handles file deletion
    async deleteFile(fileKey, element) {
        const fileName = fileKey.split('/').pop();
        if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;

        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`; // Show loading spinner
        try {
            const response = await fetch(`${this.WORKER_URL}/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: fileKey }),
            });
            if (!response.ok) throw new Error('Deletion failed');

            // Remove the card from the UI
            element.closest('.file-card').remove();

            // Check if folder is now empty and update status
            const filesResponse = await fetch(`${this.WORKER_URL}/files?prefix=${this.currentFolder}`);
            const files = await filesResponse.json();
            if (files.length === 0) {
                this.occupiedFolders.delete(this.currentFolder);
                this.renderFolders();
            }

        } catch (error) {
            console.error("Deletion failed:", error);
            alert("Could not delete the file.");
            element.innerHTML = `<i class="fas fa-trash"></i>`; // Revert spinner on error
        }
    }

    // Handles file download
    async downloadFile(fileKey) {
        try {
            // 1. Get a secure download URL from our worker
            const presignResponse = await fetch(`${this.WORKER_URL}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: fileKey }),
            });
            if (!presignResponse.ok) throw new Error('Could not get download URL');
            const { url } = await presignResponse.json();

            // 2. Open the URL to trigger download
            window.open(url, '_blank');
        } catch (error) {
            console.error("Download failed:", error);
            alert("Could not get download link.");
        }
    }

    // --- UI and Modal Logic (Mostly unchanged, simplified) ---

    showUploadProgress(fileName) {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.className = 'fixed top-5 right-5 bg-black/80 text-white p-4 rounded-lg z-[9999] shadow-lg';
        progressDiv.innerHTML = `Uploading ${fileName}... <i class="fas fa-spinner fa-spin ml-2"></i>`;
        document.body.appendChild(progressDiv);
    }

    hideUploadProgress() {
        const progressDiv = document.getElementById('upload-progress');
        if (progressDiv) document.body.removeChild(progressDiv);
    }

    openUnlockModal(folderName) {
        const folder = this.predefinedFolders.find(f => f.name === folderName);
        if (!folder) return;
        document.getElementById('unlock-title').textContent = `🔐 Unlock Galaxy - ${folderName}`;
        this.showModal('unlock-modal');
        this.folderToUnlock = folder;
    }

    async unlockFolder() {
        if (!this.folderToUnlock) return;
        const password = document.getElementById('unlock-password').value;
        if (password === this.folderToUnlock.password) {
            this.currentFolder = this.folderToUnlock.name;
            this.hideModal('unlock-modal');
            document.getElementById('unlock-password').value = '';
            document.getElementById('folder-title').textContent = `📁 ${this.currentFolder} - Cloud Storage`;
            this.showModal('folder-modal');
            await this.renderFiles();
        } else {
            alert('Incorrect password!');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    setupEventListeners() {
        document.getElementById('unlock-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.unlockFolder();
        });
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('file-upload').click();
        });
        document.getElementById('file-upload').addEventListener('change', () => {
            this.uploadFile();
        });
        document.getElementById('filter-btn').addEventListener('click', () => {
            this.showOnlyOccupied = !this.showOnlyOccupied;
            document.getElementById('filter-text').textContent = this.showOnlyOccupied ? '📁 Show All' : '🔓 Show Occupied';
            this.renderFolders();
        });
        document.getElementById('close-folder').addEventListener('click', () => this.hideModal('folder-modal'));
        document.getElementById('cancel-unlock').addEventListener('click', () => this.hideModal('unlock-modal'));
        // Note: Text editor functionality has been removed for simplicity, as it requires more complex state management.
        document.getElementById('create-text-btn').style.display = 'none';
    }
}

// Initialize the application
const aumiverse = new AumiVerse();
window.aumiverse = aumiverse;