import { Panel } from './components/Panel';
import { FileManagerService } from './services/FileManagerService';
export class FileManagerApp {
    constructor() {
        this.activePanelName = 'left';
        this.activeToasts = [];
        this.fileService = new FileManagerService();
        const createPanel = (name) => new Panel({
            elementId: `${name}Panel`,
            name,
            service: this.fileService,
            onActivate: () => this.setActivePanel(name)
        });
        this.leftPanel = createPanel('left');
        this.rightPanel = createPanel('right');
        this.leftPanel.setActive(true);
        this.setupActionButtons();
        this.initialize();
    }
    setActivePanel(name) {
        if (this.activePanelName === name)
            return;
        const target = name === 'left' ? this.leftPanel : this.rightPanel;
        const other = name === 'left' ? this.rightPanel : this.leftPanel;
        other.setActive(false);
        target.setActive(true);
        this.activePanelName = name;
    }
    getSelectedItems(panel) {
        const items = panel.getSelected();
        if (items.length === 0) {
            this.showToast('⚠️', 'Не выбрано ни одного файла или папки', 'warning');
            return null;
        }
        return items;
    }
    getOperationPanels() {
        const source = this.activePanelName === 'left' ? this.leftPanel : this.rightPanel;
        const target = this.activePanelName === 'left' ? this.rightPanel : this.leftPanel;
        return { source, target };
    }
    async performFileOperation(operation, items, source, target) {
        const action = operation === 'copy' ? 'копировании' : 'перемещении';
        const verb = operation === 'copy' ? 'Скопировано' : 'Перемещено';
        const method = operation === 'copy'
            ? this.fileService.copy.bind(this.fileService)
            : this.fileService.move.bind(this.fileService);
        const destPath = target.getPath();
        try {
            for (const item of items) {
                const fileName = this.getFileName(item);
                await method(item, `${destPath}/${fileName}`);
            }
            this.showToast('✅', `${verb} элементов: ${items.length}`, 'success');
            if (operation === 'move') {
                await source.loadItems(source.getPath());
            }
            await target.loadItems(destPath);
        }
        catch (error) {
            this.showError(`Ошибка при ${action}`, error);
        }
    }
    async copyFiles() {
        const { source, target } = this.getOperationPanels();
        const items = this.getSelectedItems(source);
        if (!items)
            return;
        await this.performFileOperation('copy', items, source, target);
    }
    async moveFiles() {
        const { source, target } = this.getOperationPanels();
        const items = this.getSelectedItems(source);
        if (!items)
            return;
        await this.performFileOperation('move', items, source, target);
    }
    async deleteFiles() {
        const panel = this.activePanelName === 'left' ? this.leftPanel : this.rightPanel;
        const items = this.getSelectedItems(panel);
        if (!items)
            return;
        const itemName = items.length === 1
            ? `"${this.getFileName(items[0])}"`
            : `${items.length} элементов`;
        if (!confirm(`Удалить ${itemName}?`))
            return;
        try {
            for (const item of items) {
                await this.fileService.delete(item);
            }
            this.showToast('✅', `Удалено элементов: ${items.length}`, 'success');
            await panel.loadItems(panel.getPath());
        }
        catch (error) {
            this.showError('Ошибка при удалении', error);
        }
    }
    getFileName(path) {
        return path.replace(/\\/g, '/').split('/').pop() || '';
    }
    showToast(icon, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
        document.body.appendChild(toast);
        const timeout = setTimeout(() => {
            toast.remove();
            this.activeToasts = this.activeToasts.filter(t => t.element !== toast);
        }, 3000);
        this.activeToasts.push({ element: toast, timeout });
    }
    showError(context, error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`${context}:`, msg);
        this.showToast('❌', `${context}: ${msg}`, 'error');
    }
    setupActionButtons() {
        const buttons = {
            copyBtn: () => this.copyFiles(),
            moveBtn: () => this.moveFiles(),
            deleteBtn: () => this.deleteFiles()
        };
        Object.entries(buttons).forEach(([id, handler]) => {
            document.getElementById(id)?.addEventListener('click', handler);
        });
    }
    async initialize() {
        try {
            await Promise.all([
                this.leftPanel.loadDrives(),
                this.rightPanel.loadDrives()
            ]);
        }
        catch (error) {
            this.showError('Не удалось запустить файловый менеджер', error);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new FileManagerApp();
});
